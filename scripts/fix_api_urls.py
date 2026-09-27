#!/usr/bin/env python3
import re
import os

STRING_RE = re.compile(
    r"""(?<!REACT_APP_API_BASE \|\| )(?<!REACT_APP_API_BASE\|\|)(['"`])http://localhost:5001([^'"`]*)\1"""
)

def fix_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    def repl(m):
        rest = m.group(2)
        return f"`${{API_BASE}}{rest}`"
    new_content, n = STRING_RE.subn(repl, content)
    if n == 0:
        return 0
    if not re.search(r"\bAPI_BASE\s*=", new_content):
        import_matches = list(re.finditer(r"^import .*?;\s*$", new_content, re.MULTILINE))
        insert_line = "\nconst API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';\n"
        if import_matches:
            last_import_end = import_matches[-1].end()
            new_content = new_content[:last_import_end] + insert_line + new_content[last_import_end:]
        else:
            new_content = insert_line + new_content
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    return n

def main():
    root = "src"
    total_files = 0
    total_repl = 0
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.endswith((".ts", ".tsx")):
                fp = os.path.join(dirpath, fn)
                n = fix_file(fp)
                if n:
                    total_files += 1
                    total_repl += n
    print(f"Total: {total_repl} URL(s) fixed across {total_files} file(s)")

if __name__ == "__main__":
    main()
