import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getStudents, addStudent, updateStudent, deleteStudent } from '../services/studentsService'
import { Student } from '../types'
import Button from '../components/Button'
import Input, { Select, Textarea } from '../components/Input'
import Modal, { ConfirmDialog } from '../components/Modal'

const EMPTY_STUDENT: Omit<Student, 'id' | 'createdAt'> = {
  name: '',
  cpf: '',
  phone: '',
  email: '',
  birthDate: '',
  healthNotes: '',
  status: 'Ativo',
}

export default function Alunos() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState(EMPTY_STUDENT)

  async function load() {
    setLoading(true)
    try {
      const data = await getStudents()
      setStudents(data)
    } catch {
      toast.error('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setSelected(null)
    setForm(EMPTY_STUDENT)
    setModalOpen(true)
  }

  function openEdit(student: Student) {
    setSelected(student)
    setForm({
      name: student.name,
      cpf: student.cpf,
      phone: student.phone,
      email: student.email,
      birthDate: student.birthDate,
      healthNotes: student.healthNotes,
      status: student.status,
    })
    setModalOpen(true)
  }

  function openDelete(student: Student) {
    setSelected(student)
    setConfirmOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    setSaving(true)
    try {
      if (selected?.id) {
        await updateStudent(selected.id, form)
        toast.success('Aluno atualizado!')
      } else {
        await addStudent(form)
        toast.success('Aluno cadastrado!')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar aluno')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected?.id) return
    setDeleting(true)
    try {
      await deleteStudent(selected.id)
      toast.success('Aluno excluído')
      setConfirmOpen(false)
      setSelected(null)
      load()
    } catch {
      toast.error('Erro ao excluir aluno')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cpf.includes(search) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Alunos</h2>
            <p className="text-gray-500 mt-1">{students.length} alunos cadastrados</p>
          </div>
          <Button onClick={openNew} size="md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Aluno
          </Button>
        </div>

        <div className="card mb-5">
          <Input
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-medium">Nenhum aluno encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">CPF</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">E-mail</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.cpf}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                      <td className="px-6 py-4">
                        <span className={student.status === 'Ativo' ? 'badge-ativo' : 'badge-inativo'}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(student)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => openDelete(student)}>
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
        title={selected ? 'Editar Aluno' : 'Novo Aluno'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {selected ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Nome Completo"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do aluno"
              required
            />
          </div>
          <Input
            label="CPF"
            value={form.cpf}
            onChange={e => setForm({ ...form, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
          <Input
            label="Telefone"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
          <Input
            label="Data de Nascimento"
            type="date"
            value={form.birthDate}
            onChange={e => setForm({ ...form, birthDate: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Observações de Saúde (Prontuário)"
              value={form.healthNotes}
              onChange={e => setForm({ ...form, healthNotes: e.target.value })}
              placeholder="Histórico de saúde, restrições, observações relevantes..."
              rows={3}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as 'Ativo' | 'Inativo' })}
            options={[
              { value: 'Ativo', label: 'Ativo' },
              { value: 'Inativo', label: 'Inativo' },
            ]}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Aluno"
        message={`Tem certeza que deseja excluir "${selected?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  )
}
