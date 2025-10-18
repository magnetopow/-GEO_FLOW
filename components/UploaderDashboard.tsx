'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { Package, Upload, Plus, Eye, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import ImageUpload from './ImageUpload'

interface PackageData {
  id: string
  name: string
  description?: string
  uploadedBy: string
  uploadedAt: string
  verifiedAt?: string
  verifiedBy?: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'COMPILED'
  imageCount: number
  compiledAt?: string
  compiledBy?: string
}

export default function UploaderDashboard() {
  const { user, token } = useAuth()
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPackageName, setNewPackageName] = useState('')
  const [newPackageDescription, setNewPackageDescription] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null)

  useEffect(() => {
    if (user?.role === 'UPLOADER') {
      fetchPackages()
    }
  }, [user])

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

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPackageName,
          description: newPackageDescription,
        }),
      })

      if (response.ok) {
        fetchPackages()
        setNewPackageName('')
        setNewPackageDescription('')
        setShowCreateForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat paket')
      }
    } catch (error) {
      console.error('Error creating package:', error)
      alert('Terjadi kesalahan saat membuat paket')
    }
  }

  const handleCompilePackage = async (packageId: string) => {
    try {
      const response = await fetch(`/api/compile/${packageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Download the PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `package_${packageId}_compiled.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Refresh packages
        fetchPackages()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal mengkompilasi paket')
      }
    } catch (error) {
      console.error('Error compiling package:', error)
      alert('Terjadi kesalahan saat mengkompilasi paket')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'VERIFIED':
        return 'bg-green-100 text-green-800'
      case 'COMPILED':
        return 'bg-blue-100 text-blue-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Uploader</h1>
          <p className="mt-2 text-gray-600">Kelola paket dokumen dan upload gambar</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Paket</p>
                <p className="text-2xl font-semibold text-gray-900">{packages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Terkompilasi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {packages.filter(p => p.status === 'COMPILED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Package Form */}
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Buat Paket Baru</h2>
            </div>
            <div className="px-6 py-4">
              <form onSubmit={handleCreatePackage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Paket</label>
                  <input
                    type="text"
                    required
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nama paket"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
                  <textarea
                    value={newPackageDescription}
                    onChange={(e) => setNewPackageDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan deskripsi paket"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Buat Paket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Packages List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Paket Dokumen Saya</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Paket Baru
              </button>
            </div>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada paket</h3>
              <p className="mt-1 text-sm text-gray-500">Mulai dengan membuat paket baru</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Paket Pertama
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Paket
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
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
                        {pkg.imageCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                          {getStatusIcon(pkg.status)}
                          <span className="ml-1">{getStatusText(pkg.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pkg.uploadedAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedPackage(pkg)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {pkg.status === 'VERIFIED' && (
                            <button
                              onClick={() => handleCompilePackage(pkg.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Kompilasi PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Package Detail Modal */}
        {selectedPackage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{selectedPackage.name}</h3>
                  <button
                    onClick={() => setSelectedPackage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Status:</strong> {getStatusText(selectedPackage.status)}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Jumlah Gambar:</strong> {selectedPackage.imageCount}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Tanggal Upload:</strong> {new Date(selectedPackage.uploadedAt).toLocaleString('id-ID')}
                  </p>
                </div>

                {selectedPackage.status === 'PENDING' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                      Paket ini sedang menunggu verifikasi dari verifikator.
                    </p>
                  </div>
                )}

                {selectedPackage.status === 'VERIFIED' && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-green-800">
                      Paket telah diverifikasi dan siap untuk dikompilasi.
                    </p>
                    <button
                      onClick={() => {
                        handleCompilePackage(selectedPackage.id)
                        setSelectedPackage(null)
                      }}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Kompilasi PDF
                    </button>
                  </div>
                )}

                {selectedPackage.status === 'COMPILED' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                      Paket telah berhasil dikompilasi menjadi PDF.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}