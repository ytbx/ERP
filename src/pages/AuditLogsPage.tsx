import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import { Search, Loader2, Database, User as UserIcon, Clock, AlertCircle } from 'lucide-react'

interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: string
  old_data: any
  new_data: any
  user_id: string
  created_at: string
  profiles?: {
    full_name: string
    email: string
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-emerald-400 bg-emerald-500/10'
      case 'UPDATE': return 'text-amber-400 bg-amber-500/10'
      case 'DELETE': return 'text-red-400 bg-red-500/10'
      default: return 'text-surface-400 bg-surface-800'
    }
  }

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const filteredLogs = logs.filter(log => 
    log.table_name.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header
        title="Denetim İzleri (Audit Logs)"
        subtitle="Sistem genelinde yapılan tüm değişiklikler"
        onSearch={setSearch}
        searchPlaceholder="Tablo, işlem veya kullanıcı ara..."
      />

      <div className="p-8 animate-fade-in">
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Tablo</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">İşlem</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider text-right">Detay</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-surface-400">
                      <Loader2 size={20} className="animate-spin" />
                      Yükleniyor...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-surface-500">Kayıt bulunamadı.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="table-row">
                    <td className="px-6 py-4 text-sm text-surface-300">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-surface-500" />
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-surface-500" />
                        <div>
                          <p className="text-sm font-medium text-surface-100">{log.profiles?.full_name || 'Sistem'}</p>
                          <p className="text-[10px] text-surface-500">{log.profiles?.email || 'system@internal'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-surface-500" />
                        <span className="text-sm font-mono text-surface-300">{log.table_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-brand-400 hover:text-brand-300 underline"
                       >
                        İncele
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title={`${selectedLog?.table_name} - İşlem Detayı`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold text-surface-500 uppercase mb-3">Eski Veri</h4>
              <pre className="text-[10px] font-mono text-surface-300 overflow-auto max-h-[300px]">
                {JSON.stringify(selectedLog?.old_data, null, 2) || '—'}
              </pre>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold text-surface-500 uppercase mb-3">Yeni Veri</h4>
              <pre className="text-[10px] font-mono text-surface-300 overflow-auto max-h-[300px]">
                {JSON.stringify(selectedLog?.new_data, null, 2) || '—'}
              </pre>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => setSelectedLog(null)} className="glass-button-secondary px-6 py-2 text-sm">Kapat</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
