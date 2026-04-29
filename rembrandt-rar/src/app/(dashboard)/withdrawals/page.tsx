"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/adminStore";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Eye, AlertTriangle, Flag, DollarSign, Clock, User } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amountKr: number;
  provider: string;
  accountName: string;
  accountDetails: any;
  status: string;
  requiresKyc: boolean;
  kycFeeDeducted: boolean;
  kycFeeAmount: number | null;
  suspiciousFlags: any;
  riskScore: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    kycStatus: string;
    kycTier: string;
    createdAt: string;
  };
  kycDocuments: any[];
}

export default function WithdrawalReviewPage() {
  const { token, isSuperAdmin, hasPermission } = useAdminStore();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isSuperAdmin() && !hasPermission("financial_management")) {
      router.push("/");
      return;
    }
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      const url = statusFilter === "all" 
        ? "http://localhost:3000/api/v1/kyc/admin/withdrawal/pending"
        : `http://localhost:3000/api/v1/kyc/admin/withdrawal/pending?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setWithdrawals(data.requests || []);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (approved: boolean, flag: boolean = false) => {
    if (!selectedWithdrawal) return;

    setReviewing(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/kyc/admin/withdrawal/review/${selectedWithdrawal.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approved,
            reviewNote,
            flagReason: flag ? flagReason : undefined,
          }),
        }
      );

      if (response.ok) {
        alert(approved ? "Withdrawal approved" : flag ? "Withdrawal flagged" : "Withdrawal rejected");
        setSelectedWithdrawal(null);
        setReviewNote("");
        setFlagReason("");
        fetchWithdrawals();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reviewing withdrawal:", error);
      alert("Failed to review withdrawal");
    } finally {
      setReviewing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600 bg-red-100";
    if (score >= 50) return "text-orange-600 bg-orange-100";
    if (score >= 30) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-gray-100 text-gray-800",
      UNDER_REVIEW: "bg-blue-100 text-blue-800",
      FLAGGED: "bg-red-100 text-red-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading withdrawal requests...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Withdrawal Review</h1>
        <p className="text-gray-600">Review and approve withdrawal requests</p>
      </div>

      <div className="mb-4 flex gap-2">
        {["all", "PENDING", "UNDER_REVIEW", "FLAGGED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {status === "all" ? "All" : status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Pending Withdrawals ({withdrawals.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{withdrawal.user.firstName} {withdrawal.user.lastName}</div>
                      <div className="text-sm text-gray-500">@{withdrawal.user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">Kr {Number(withdrawal.amountKr).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      withdrawal.user.kycStatus === "APPROVED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {withdrawal.user.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {withdrawal.riskScore >= 50 && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getRiskColor(withdrawal.riskScore)}`}>
                        {withdrawal.riskScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(withdrawal.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {withdrawals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No withdrawal requests to review
            </div>
          )}
        </div>
      </div>

      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Review Withdrawal Request</h2>
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
                    <span className="font-medium">{selectedWithdrawal.user.firstName} {selectedWithdrawal.user.lastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Username:</span>{" "}
                    <span className="font-medium">@{selectedWithdrawal.user.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">KYC Status:</span>{" "}
                    <span className="font-medium">{selectedWithdrawal.user.kycStatus}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Withdrawal Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>{" "}
                    <span className="font-medium">Kr {Number(selectedWithdrawal.amountKr).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Provider:</span>{" "}
                    <span className="font-medium">{selectedWithdrawal.provider}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Name:</span>{" "}
                    <span className="font-medium">{selectedWithdrawal.accountName}</span>
                  </div>
                  {selectedWithdrawal.kycFeeDeducted && (
                    <div>
                      <span className="text-gray-600">KYC Fee:</span>{" "}
                      <span className="font-medium">Kr {selectedWithdrawal.kycFeeAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(selectedWithdrawal.suspiciousFlags || {}).length > 0 && (
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    Suspicious Patterns Detected
                  </h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedWithdrawal.suspiciousFlags).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="font-medium text-red-700">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                        <span className="text-red-600">{JSON.stringify(value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-600">Risk Score:</span>{" "}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getRiskColor(selectedWithdrawal.riskScore)}`}>
                      {selectedWithdrawal.riskScore}/100
                    </span>
                  </div>
                </div>
              )}

              {selectedWithdrawal.kycDocuments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">KYC Documents</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedWithdrawal.kycDocuments.map((doc) => (
                      <div key={doc.id} className="border rounded p-2">
                        <p className="text-xs font-medium mb-1">{doc.documentType}</p>
                        <img src={doc.frontImageUrl} alt="KYC" className="w-full h-32 object-cover rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Review Note</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Add review note..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Flag Reason (if flagging)</label>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                  placeholder="Reason for flagging..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-4">
              <button
                onClick={() => handleReview(true)}
                disabled={reviewing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                Approve
              </button>
              <button
                onClick={() => handleReview(false, true)}
                disabled={reviewing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                <Flag className="w-5 h-5" />
                Flag
              </button>
              <button
                onClick={() => handleReview(false)}
                disabled={reviewing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
              <button
                onClick={() => setSelectedWithdrawal(null)}
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
