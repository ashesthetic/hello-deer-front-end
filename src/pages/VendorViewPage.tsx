import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { vendorsApi } from '../services/api';
import { Vendor } from '../types';
import VendorView from '../components/VendorView';
import Modal from '../components/Modal';
import { usePageTitle } from '../hooks/usePageTitle';

const VendorViewPage: React.FC = () => {
  usePageTitle('Vendor Details');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!id) return;
      
      try {
        const response = await vendorsApi.getById(parseInt(id));
        setVendor(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch vendor');
      } finally {
        setFetching(false);
      }
    };

    fetchVendor();
  }, [id]);

  const handleEdit = () => {
    if (vendor) {
      navigate(`/accounting/vendors/${vendor.id}/edit`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!vendor) return;
    
    setDeleting(true);
    try {
      await vendorsApi.delete(vendor.id!);
      navigate('/accounting/vendors');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
  };

  const handleBack = () => {
    navigate('/accounting/vendors');
  };

  // Check permissions
  const canEdit = currentUser?.role === 'admin' || 
    (currentUser?.role === 'editor' && vendor?.user_id === currentUser?.id);
  const canDelete = currentUser?.role === 'admin';

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Vendors
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Vendors
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Vendor not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Vendors
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      <VendorView
        vendor={vendor}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Modal for delete confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Vendor"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      >
        Are you sure you want to delete vendor <b>{vendor?.name}</b>?
      </Modal>
    </div>
  );
};

export default VendorViewPage; 