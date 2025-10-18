'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { User, Plus, Edit, Trash2, Users, Package, CheckCircle, XCircle } from 'lucide-react'

interface UserData {
  id: string
  username: string
  email: string
  role: 'ADMIN' | 'UPLOADER' | 'VERIFIER'
  createdAt: string
  updatedAt: string
}

interface PackageData {
  id: string
  name: string
  description?: string
  uploadedBy: string
  uploadedAt: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'COMPILED'
  imageCount: number
}

export default function AdminDashboard() {
  const { user, token } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'UPLOADER' as 'UPLOADER' | 'VERIFIER',
  })

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers()
      fetchPackages()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchUsers()
        setFormData({ username: '', email: '', password: '', role: 'UPLOADER' })
        setShowUserForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat pengguna')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Terjadi kesalahan saat membuat pengguna')
    }
  }

  const handleEditUser = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    })
    setShowUserForm(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          role: formData.role,
        }),
      })

      if (response.ok) {
        fetchUsers()
        setEditingUser(null)
        setFormData({ username: '', email: '', password: '', role: 'UPLOADER' })
        setShowUserForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal mengupdate pengguna')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Terjadi kesalahan saat mengupdate pengguna')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menghapus pengguna')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Terjadi kesalahan saat menghapus pengguna')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'COMPILED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Menunggu Verifikasi'
      case 'VERIFIED':
        return 'Terverifikasi'
      case 'COMPILED':
        return 'Terkompilasi'
      case 'REJECTED':
        return 'Ditolak'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="mt-2 text-gray-600">Kelola pengguna dan pantau status paket dokumen</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pengguna</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Paket</p>
                <p className="text-2xl font-semibold text-gray-900">{packages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Menunggu Verifikasi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {packages.filter(p => p.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Terverifikasi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {packages.filter(p => p.status === 'VERIFIED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Manajemen Pengguna</h2>
              <button
                onClick={() => {
                  setEditingUser(null)
                  setFormData({ username: '', email: '', password: '', role: 'UPLOADER' })
                  setShowUserForm(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pengguna
              </button>
            </div>
          </div>

          {showUserForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'UPLOADER' | 'VERIFIER' })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UPLOADER">Uploader</option>
                      <option value="VERIFIER">Verifier</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUserForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingUser ? 'Update' : 'Tambah'} Pengguna
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dibuat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'UPLOADER' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packages Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Paket Dokumen</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Paket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Gambar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Upload
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        {pkg.description && (
                          <div className="text-sm text-gray-500">{pkg.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {users.find(u => u.id === pkg.uploadedBy)?.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.imageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(pkg.status)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(pkg.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pkg.uploadedAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}