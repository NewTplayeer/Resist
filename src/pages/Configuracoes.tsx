import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getServices, addService, updateService, deleteService } from '../services/servicesService'
import { Service } from '../types'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal, { ConfirmDialog } from '../components/Modal'

const EMPTY_FORM = { name: '', basePrice: 0 }

export default function Configuracoes() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<Service | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function load() {
    setLoading(true)
    try {
      setServices(await getServices())
    } catch {
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(service: Service) {
    setSelected(service)
    setForm({ name: service.name, basePrice: service.basePrice })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    if (!form.basePrice || form.basePrice <= 0) return toast.error('Valor base deve ser maior que zero')
    setSaving(true)
    try {
      const data = { ...form, basePrice: Number(form.basePrice) }
      if (selected?.id) {
        await updateService(selected.id, data)
        toast.success('Serviço atualizado!')
      } else {
        await addService(data)
        toast.success('Serviço criado!')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected?.id) return
    setDeleting(true)
    try {
      await deleteService(selected.id)
      toast.success('Serviço excluído')
      setConfirmOpen(false)
      setSelected(null)
      load()
    } catch {
      toast.error('Erro ao excluir serviço')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Configurações</h2>
            <p className="text-gray-500 mt-1">Gerencie os tipos de serviços</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-800">Serviços Cadastrados</h3>
            <Button onClick={openNew} size="sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Serviço
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm font-medium">Nenhum serviço cadastrado</p>
              <p className="text-xs mt-1">Crie serviços como Pilates, Fisioterapia, RPG, etc.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {services.map(service => (
                <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-primary-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{service.name}</p>
                      <p className="text-sm text-gray-500">
                        Valor base: <span className="font-semibold text-primary-700">R$ {service.basePrice.toFixed(2).replace('.', ',')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(service)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => { setSelected(service); setConfirmOpen(true) }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card border border-blue-100 bg-blue-50">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Configuração do Firebase
          </h3>
          <p className="text-sm text-blue-700">
            Para conectar ao banco de dados, configure as variáveis de ambiente no arquivo <code className="bg-blue-100 px-1 rounded font-mono text-xs">.env</code> com as credenciais do seu projeto Firebase.
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Consulte o arquivo <code className="bg-blue-100 px-1 rounded font-mono">.env.example</code> para ver as variáveis necessárias.
          </p>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar Serviço' : 'Novo Serviço'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {selected ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome do Serviço"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Pilates, Fisioterapia, RPG..."
          />
          <Input
            label="Valor Base (R$)"
            type="number"
            min="0"
            step="0.01"
            value={form.basePrice || ''}
            onChange={e => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })}
            placeholder="0,00"
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Serviço"
        message={`Deseja excluir o serviço "${selected?.name}"? Agendamentos e pagamentos vinculados não serão afetados.`}
      />
    </div>
  )
}
