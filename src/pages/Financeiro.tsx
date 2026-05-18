import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { getPayments, addPayment, updatePayment, deletePayment, getPaymentsByPeriod } from '../services/paymentsService'
import { getStudents } from '../services/studentsService'
import { getServices } from '../services/servicesService'
import { Payment, Student, Service, PaymentStatus } from '../types'
import Button from '../components/Button'
import Input, { Select } from '../components/Input'
import Modal, { ConfirmDialog } from '../components/Modal'

const EMPTY_FORM = {
  studentId: '',
  studentName: '',
  serviceId: '',
  serviceName: '',
  amount: 0,
  status: 'Pendente' as PaymentStatus,
  dueDate: format(new Date(), 'yyyy-MM-dd'),
  paidAt: '',
  description: '',
}

export default function Financeiro() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<Payment | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | ''>('')
  const [periodStart, setPeriodStart] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'))
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reportMode, setReportMode] = useState(false)
  const [reportData, setReportData] = useState<Payment[]>([])

  async function load() {
    setLoading(true)
    try {
      const [pays, studs, servs] = await Promise.all([
        getPayments(),
        getStudents(),
        getServices(),
      ])
      setPayments(pays)
      setStudents(studs)
      setServices(servs)
    } catch {
      toast.error('Erro ao carregar dados financeiros')
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

  function openEdit(payment: Payment) {
    setSelected(payment)
    setForm({
      studentId: payment.studentId,
      studentName: payment.studentName,
      serviceId: payment.serviceId,
      serviceName: payment.serviceName,
      amount: payment.amount,
      status: payment.status,
      dueDate: payment.dueDate,
      paidAt: payment.paidAt || '',
      description: payment.description,
    })
    setModalOpen(true)
  }

  function handleStudentChange(studentId: string) {
    const student = students.find(s => s.id === studentId)
    setForm(f => ({ ...f, studentId, studentName: student?.name || '' }))
  }

  function handleServiceChange(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    setForm(f => ({
      ...f,
      serviceId,
      serviceName: service?.name || '',
      amount: service?.basePrice || f.amount,
    }))
  }

  async function handleSave() {
    if (!form.studentId) return toast.error('Selecione um aluno')
    if (!form.amount || form.amount <= 0) return toast.error('Valor deve ser maior que zero')
    setSaving(true)
    try {
      const data = { ...form, amount: Number(form.amount) }
      if (selected?.id) {
        await updatePayment(selected.id, data)
        toast.success('Pagamento atualizado!')
      } else {
        await addPayment(data)
        toast.success('Pagamento registrado!')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar pagamento')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected?.id) return
    setDeleting(true)
    try {
      await deletePayment(selected.id)
      toast.success('Pagamento excluído')
      setConfirmOpen(false)
      setSelected(null)
      load()
    } catch {
      toast.error('Erro ao excluir pagamento')
    } finally {
      setDeleting(false)
    }
  }

  async function handleReport() {
    try {
      const data = await getPaymentsByPeriod(periodStart, periodEnd)
      setReportData(data)
      setReportMode(true)
    } catch {
      toast.error('Erro ao gerar relatório')
    }
  }

  const filtered = payments.filter(p => !filterStatus || p.status === filterStatus)
  const totalPago = filtered.filter(p => p.status === 'Pago').reduce((a, p) => a + p.amount, 0)
  const totalPendente = filtered.filter(p => p.status === 'Pendente').reduce((a, p) => a + p.amount, 0)
  const totalAtrasado = filtered.filter(p => p.status === 'Atrasado').reduce((a, p) => a + p.amount, 0)
  const reportTotal = reportData.filter(p => p.status === 'Pago').reduce((a, p) => a + p.amount, 0)

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Financeiro</h2>
            <p className="text-gray-500 mt-1">Controle de pagamentos</p>
          </div>
          <Button onClick={openNew}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Pagamento
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          {[
            { label: 'Recebido', value: totalPago, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
            { label: 'Pendente', value: totalPendente, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
            { label: 'Atrasado', value: totalAtrasado, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          ].map(stat => (
            <div key={stat.label} className={`card border ${stat.bg}`}>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                R$ {stat.value.toFixed(2).replace('.', ',')}
              </p>
            </div>
          ))}
        </div>

        <div className="card mb-5 flex flex-wrap items-end gap-4">
          <Select
            label="Filtrar por Status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PaymentStatus | '')}
            options={[
              { value: '', label: 'Todos' },
              { value: 'Pago', label: 'Pago' },
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Atrasado', label: 'Atrasado' },
            ]}
            className="w-44"
          />
          <div className="flex items-end gap-2 border-l border-gray-200 pl-4 ml-2">
            <Input label="De" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-40" />
            <Input label="Até" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={handleReport}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Relatório
            </Button>
          </div>
        </div>

        {reportMode && (
          <div className="card mb-5 border border-primary-200 bg-primary-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-primary-800">Relatório: {periodStart} → {periodEnd}</h3>
              <button onClick={() => setReportMode(false)} className="text-xs text-gray-400 hover:text-gray-600">Fechar</button>
            </div>
            <p className="text-sm text-gray-600">{reportData.length} pagamento(s) encontrado(s)</p>
            <p className="text-lg font-bold text-green-700 mt-1">
              Total Recebido: R$ {reportTotal.toFixed(2).replace('.', ',')}
            </p>
            <div className="mt-3 space-y-1">
              {reportData.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-primary-100">
                  <span className="text-gray-700">{p.studentName} · {p.description || p.serviceName}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === 'Pago' ? 'badge-pago' : p.status === 'Pendente' ? 'badge-pendente' : 'badge-atrasado'}`}>{p.status}</span>
                    <span className="font-semibold text-gray-800">R$ {p.amount.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm font-medium">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aluno</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Serviço/Descrição</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vencimento</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{payment.studentName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payment.description || payment.serviceName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payment.dueDate}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800 text-right">
                        R$ {payment.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          payment.status === 'Pago' ? 'badge-pago' :
                          payment.status === 'Pendente' ? 'badge-pendente' : 'badge-atrasado'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(payment)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => { setSelected(payment); setConfirmOpen(true) }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar Pagamento' : 'Novo Pagamento'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {selected ? 'Salvar' : 'Registrar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Aluno"
            value={form.studentId}
            onChange={e => handleStudentChange(e.target.value)}
            options={[
              { value: '', label: 'Selecione o aluno...' },
              ...students.map(s => ({ value: s.id!, label: s.name })),
            ]}
          />
          <Select
            label="Serviço"
            value={form.serviceId}
            onChange={e => handleServiceChange(e.target.value)}
            options={[
              { value: '', label: 'Selecione o serviço (opcional)...' },
              ...services.map(s => ({ value: s.id!, label: `${s.name} — R$ ${s.basePrice.toFixed(2).replace('.', ',')}` })),
            ]}
          />
          <Input
            label="Descrição"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Mensalidade, avulso, etc."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              type="number"
              min="0"
              step="0.01"
              value={form.amount || ''}
              onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Vencimento"
              type="date"
              value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as PaymentStatus })}
            options={[
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Pago', label: 'Pago' },
              { value: 'Atrasado', label: 'Atrasado' },
            ]}
          />
          {form.status === 'Pago' && (
            <Input
              label="Data do Pagamento"
              type="date"
              value={form.paidAt}
              onChange={e => setForm({ ...form, paidAt: e.target.value })}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Pagamento"
        message={`Deseja excluir o pagamento de "${selected?.studentName}"?`}
      />
    </div>
  )
}
