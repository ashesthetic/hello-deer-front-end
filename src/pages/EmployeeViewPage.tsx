import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canCreate } from '../utils/permissions';
import ConfirmationModal from '../components/ConfirmationModal';
import { employeesApi, Employee as ApiEmployee } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

// Get the storage URL from environment or derive from API URL
const getStorageUrl = () => {
  // Use dedicated storage URL if available
  if (process.env.REACT_APP_STORAGE_URL) {
    return process.env.REACT_APP_STORAGE_URL;
  }
  
  // Otherwise derive from API URL
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  // Remove /api from the end to get the base URL
  return apiUrl.replace(/\/api$/, '');
};
const EmployeeViewPage: React.FC = () => {
  usePageTitle('Employee Details');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [employee, setEmployee] = useState<ApiEmployee | null>(null);
  const [loading, setLoading] = useState(true);


  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const employeeResponse = await employeesApi.getById(parseInt(id));
        setEmployee(employeeResponse.data.data);

      } catch (err: any) {
        console.error(err.message);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
    }, [id]);

  const handleEdit = () => {
    navigate(`/employees/${id}/edit`);
  };

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employee) return;
    
    try {
      await employeesApi.delete(employee.id);
      navigate('/employees');
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleBack = () => {
    navigate('/employees');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading employee details...</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employee.full_legal_name}</h1>
            <p className="text-gray-600">{employee.position} • {employee.department}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            {canCreate(currentUser) && (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Employee Information */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Employee Information</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name</label>
                  <p className="text-gray-900">{employee.full_legal_name}</p>
                </div>
                {employee.preferred_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
                    <p className="text-gray-900">{employee.preferred_name}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <p className="text-gray-900">{new Date(employee.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <p className="text-gray-900">{employee.phone_number}</p>
                </div>
                {employee.alternate_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Number</label>
                    <p className="text-gray-900">{employee.alternate_number}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{employee.email}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{employee.address}</p>
                  {employee.postal_code && <p className="text-gray-900">{employee.postal_code}</p>}
                  <p className="text-gray-900">{employee.country}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{employee.emergency_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <p className="text-gray-900">{employee.emergency_relationship}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <p className="text-gray-900">{employee.emergency_phone}</p>
                </div>
                {employee.emergency_alternate_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Number</label>
                    <p className="text-gray-900">{employee.emergency_alternate_number}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{employee.emergency_address_line1}</p>
                  {employee.emergency_address_line2 && <p className="text-gray-900">{employee.emergency_address_line2}</p>}
                  <p className="text-gray-900">{employee.emergency_city}, {employee.emergency_state} {employee.emergency_postal_code}</p>
                  <p className="text-gray-900">{employee.emergency_country}</p>
                </div>
              </div>
            </div>

            {/* Official Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Official Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status in Canada</label>
                  <p className="text-gray-900">
                    {employee.status_in_canada}
                    {employee.other_status && ` - ${employee.other_status}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIN Number</label>
                  <p className="text-gray-900">{employee.sin_number}</p>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <p className="text-gray-900">{employee.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <p className="text-gray-900">{employee.position}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="text-gray-900">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                  <p className="text-gray-900">{new Date(employee.hire_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                  <p className="text-gray-900">${employee.hourly_rate}/hour</p>
                </div>
              </div>
            </div>

            {/* Social Information */}
            {(employee.facebook || employee.linkedin || employee.twitter) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Social Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {employee.facebook && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                      <a href={employee.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {employee.facebook}
                      </a>
                    </div>
                  )}
                  {employee.linkedin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <a href={employee.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {employee.linkedin}
                      </a>
                    </div>
                  )}
                  {employee.twitter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                      <a href={employee.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {employee.twitter}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {(employee.government_id_file || employee.work_permit_file || employee.resume_file || employee.photo_file || employee.void_cheque_file) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {employee.government_id_file && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Government ID</label>
                      <a 
                        href={`${getStorageUrl()}/storage/${employee.government_id_file}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Government ID
                      </a>
                    </div>
                  )}
                  {employee.work_permit_file && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Permit</label>
                      <a 
                        href={`${getStorageUrl()}/storage/${employee.work_permit_file}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Work Permit
                      </a>
                    </div>
                  )}
                  {employee.resume_file && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                      <a 
                        href={`${getStorageUrl()}/storage/${employee.resume_file}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Resume
                      </a>
                    </div>
                  )}
                  {employee.photo_file && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                      <a 
                        href={`${getStorageUrl()}/storage/${employee.photo_file}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Photo
                      </a>
                    </div>
                  )}
                  {employee.void_cheque_file && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Void Cheque</label>
                      <a 
                        href={`${getStorageUrl()}/storage/${employee.void_cheque_file}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Void Cheque
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default EmployeeViewPage; 