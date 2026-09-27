#!/usr/bin/env python3
import re
import os

DECL_RE = re.compile(
    r"(const|let)\s+API_BASE\s*=\s*(?:process\.env\.REACT_APP_API_BASE\s*\|\|\s*)?"
    r"`\$\{API_BASE\}([^`]*)`\s*;"
)

def fix_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    def repl(m):
        keyword = m.group(1)
        suffix = m.group(2)
        base_expr = "process.env.REACT_APP_API_BASE || 'http://localhost:5001'"
        if suffix:
            return f"{keyword} API_BASE = `${{{base_expr}}}{suffix}`;"
        else:
            return f"{keyword} API_BASE = {base_expr};"
    content, n = DECL_RE.subn(repl, content)
    if n > 0:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
    return n

def main():
    root = "src"
    total = 0
    files_fixed = 0
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.endswith((".ts", ".tsx")):
                fp = os.path.join(dirpath, fn)
                n = fix_file(fp)
                if n:
                    total += n
                    files_fixed += 1
    print(f"Total: {total} self-referencing declaration(s) fixed across {files_fixed} file(s)")

if __name__ == "__main__":
    main()
