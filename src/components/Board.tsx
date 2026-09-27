import { useState, useEffect } from "react";
import { Card, CardContent, Chip, Button } from "@mui/material";
import { getBoardMembers, BoardMember } from "../utils/boardMembersApi";

const Board = () => {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [chairperson, setChairperson] = useState<BoardMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadBoardMembers = async () => {
      try {
        setLoading(true);
        const data = await getBoardMembers();
        if (isMounted) {
          setBoardMembers(data);
          // Find chairperson by position (Chairman or Chairperson)
          const chair = data.find(member => 
            member.position.toLowerCase().includes('chairman') || 
            member.position.toLowerCase().includes('chairperson')
          );
          if (chair) {
            setChairperson(chair);
          }
        }
      } catch (err) {
        console.error('Error loading board members:', err);
        if (isMounted) {
          setError('Failed to load board members');
          // Fallback to default data
          const fallbackData = [
            {
              id: 1,
              name: "Hon. Purity Wangui Ngirici",
              position: "Chairperson",
              image: "https://dev.xtranet.co.ke/kenyaseed/wp-content/uploads/2025/07/Purity-300x300.jpg",
              bio: "Hon. Purity Wangui Ngirici is a resourceful, accomplished, highly organized, results-oriented, focused, resilient and enthusiastic human resource, strategic management, gender and development specialist with a Masters in Marketing Management and over 20 years of professional hands-on experience cutting across the national, county government and not-for profiting making sectors.",
              order_index: 0,
              is_active: true,
              created_at: "",
              updated_at: ""
            }
          ];
          setBoardMembers(fallbackData);
          setChairperson(fallbackData[0]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBoardMembers();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Function to close modal on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedMember(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.warn('Board members error:', error);
  }

  // Filter out chairperson from regular board members
  const regularMembers = boardMembers.filter(member => 
    !member.position.toLowerCase().includes('chairman') && 
    !member.position.toLowerCase().includes('chairperson')
  );

  return (
    <div className="min-h-screen">
      <main>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-6">
                Meet Our Board Members
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our board comprises experienced leaders who provide strategic guidance
                 and governance oversight to ensure Kenya Seed Company's continued success and impact in the agricultural sector.
              </p>
            </div>

            {/* Chairperson Section */}
            {chairperson && (
              <div className="flex justify-center mb-16">
                <Card className="shadow-agricultural border-0 hover:shadow-lg transition-all duration-300 max-w-2xl">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <img
                        src={chairperson.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0yMDAgMTIwQzE3OC43ODkgMTIwIDE2MC44MTEgMTM4IDI4LDE2MC44MTEgMTYwLjgxMSAyMjAuODExIDI0MCAxNjAuODExIDI0MCAxMjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMjAgMjgwQzEyMCAyMzUuODg1IDE1NS44ODUgMjAwIDIwMCAyMDBDMjQ0LjExNSAyMDAgMjgwIDIzNS44ODUgMjgwIDI4MFYzMjBIMTIwVjI4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                        alt={chairperson.name}
                        className="w-40 h-40 rounded-full mx-auto mb-6 object-contain bg-gray-100 border-4 border-primary/20"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0yMDAgMTIwQzE3OC43ODkgMTIwIDE2MC44MTEgMTM4IDI4LDE2MC44MTEgMTYwLjgxMSAyMjAuODExIDI0MCAxNjAuODExIDI0MCAxMjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMjAgMjgwQzEyMCAyMzUuODg1IDE1NS44ODUgMjAwIDIwMCAyMDBDMjQ0LjExNSAyMDAgMjgwIDIzNS44ODUgMjgwIDI4MFYzMjBIMTIwVjI4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                        }}
                        loading="lazy"
                      />
                      <h3 className="text-2xl font-bold text-primary mb-2">
                        {chairperson.name}
                      </h3>
                      <p className="text-secondary font-semibold text-lg mb-3">
                        {chairperson.position}
                      </p>
                      <Chip variant="outlined" size="small" label="Board Chairperson" />
                    </div>

                    <div className="text-center mt-6">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedMember(chairperson)}
                      >
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other Board Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularMembers.map((member) => (
                <Card
                  key={member.id}
                  className="shadow-agricultural border-0 hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <img
                        src={member.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0yMDAgMTIwQzE3OC43ODkgMTIwIDE2MC44MTEgMTM4IDI4LDE2MC44MTEgMTYwLjgxMSAyMjAuODExIDI0MCAxNjAuODExIDI0MCAxMjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMjAgMjgwQzEyMCAyMzUuODg1IDE1NS44ODUgMjAwIDIwMCAyMDBDMjQ0LjExNSAyMDAgMjgwIDIzNS44ODUgMjgwIDI4MFYzMjBIMTIwVjI4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                        alt={member.name}
                        className="w-32 h-32 rounded-full mx-auto mb-4 object-contain bg-gray-100 border-4 border-primary/20"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0yMDAgMTIwQzE3OC43ODkgMTIwIDE2MC44MTEgMTM4IDI4LDE2MC44MTEgMTYwLjgxMSAyMjAuODExIDI0MCAxNjAuODExIDI0MCAxMjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMjAgMjgwQzEyMCAyMzUuODg1IDE1NS44ODUgMjAwIDIwMCAyMDBDMjQ0LjExNSAyMDAgMjgwIDIzNS44ODUgMjgwIDI4MFYzMjBIMTIwVjI4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                        }}
                        loading="lazy"
                      />
                      <h3 className="text-xl font-bold text-primary mb-2">
                        {member.name}
                      </h3>
                      <p className="text-secondary font-semibold mb-3">
                        {member.position}
                      </p>
                    </div>

                    <div className="text-center mt-4">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedMember(member)}
                      >
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Modal Overlay */}
        {selectedMember && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleOverlayClick}
          >
            <div
              className="bg-white rounded-lg shadow-lg max-w-3xl w-full relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()} // Prevent overlay click from closing when inside modal
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-8 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>

              <div className="flex flex-col md:flex-row items-center md:items-start p-6 gap-6">
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  className="w-40 h-40 object-cover rounded-full border-4 border-primary/20 mx-auto md:mx-0"
                />
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {selectedMember.name}
                  </h2>
                  <p className="text-secondary font-semibold mb-4">
                    {selectedMember.position}
                  </p>
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                    {selectedMember.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Board;
