"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/adminStore";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Eye, FileText, User, AlertTriangle } from "lucide-react";

interface KYCDocument {
  id: string;
  userId: string;
  documentType: string;
  frontImageUrl: string;
  backImageUrl: string | null;
  selfieUrl: string;
  fullName: string | null;
  documentNumber: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
}

export default function KYCVerificationPage() {
  const { token, isSuperAdmin, hasPermission } = useAdminStore();
  const router = useRouter();
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationNote, setVerificationNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [nameMatches, setNameMatches] = useState(true);
  const [nameMatchScore, setNameMatchScore] = useState(100);

  useEffect(() => {
    if (!isSuperAdmin() && !hasPermission("financial_management")) {
      router.push("/");
      return;
    }
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/kyc/admin/kyc/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (approved: boolean) => {
    if (!selectedDoc) return;

    setVerifying(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/kyc/admin/kyc/verify/${selectedDoc.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approved,
            verificationNote: approved ? verificationNote : undefined,
            rejectionReason: !approved ? rejectionReason : undefined,
            nameMatches,
            nameMatchScore,
          }),
        }
      );

      if (response.ok) {
        alert(approved ? "KYC approved successfully" : "KYC rejected");
        setSelectedDoc(null);
        setVerificationNote("");
        setRejectionReason("");
        fetchPendingKYC();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error verifying KYC:", error);
      alert("Failed to verify KYC");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading KYC documents...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
        <p className="text-gray-600">Review and verify user identity documents</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Verifications ({documents.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => {
                const accountAgeDays = Math.floor(
                  (Date.now() - new Date(doc.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{doc.user.firstName} {doc.user.lastName}</div>
                        <div className="text-sm text-gray-500">@{doc.user.username}</div>
                        <div className="text-xs text-gray-400">{doc.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {doc.documentType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {accountAgeDays < 7 && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-sm">{accountAgeDays} days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {documents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No pending KYC documents
            </div>
          )}
        </div>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Review KYC Document</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">{selectedDoc.user.firstName} {selectedDoc.user.lastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Username:</span>{" "}
                    <span className="font-medium">@{selectedDoc.user.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>{" "}
                    <span className="font-medium">{selectedDoc.user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Created:</span>{" "}
                    <span className="font-medium">{new Date(selectedDoc.user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Images
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Front</p>
                    <img
                      src={selectedDoc.frontImageUrl}
                      alt="Document Front"
                      className="w-full h-48 object-cover rounded border"
                    />
                  </div>
                  {selectedDoc.backImageUrl && (
                    <div>
                      <p className="text-sm font-medium mb-2">Back</p>
                      <img
                        src={selectedDoc.backImageUrl}
                        alt="Document Back"
                        className="w-full h-48 object-cover rounded border"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-2">Selfie</p>
                    <img
                      src={selectedDoc.selfieUrl}
                      alt="Selfie"
                      className="w-full h-48 object-cover rounded border"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Name Verification</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={nameMatches}
                        onChange={(e) => setNameMatches(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span>Name matches document</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Match Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nameMatchScore}
                      onChange={(e) => setNameMatchScore(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Verification Note (if approving)
                </label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Optional note about verification..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Reason for rejection..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-4">
              <button
                onClick={() => handleVerify(true)}
                disabled={verifying}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                Approve KYC
              </button>
              <button
                onClick={() => handleVerify(false)}
                disabled={verifying}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Reject KYC
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-6 py-3 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
