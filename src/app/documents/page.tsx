'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Document = {
  id: string;
  org_id: string;
  beneficiary_id: string | null;
  caregiver_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  doc_type: string;
  visit_date: string;
  notes: string;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

type Beneficiary = { id: string; full_name: string; area: string; };
type Caregiver = { id: string; name: string; area: string; };

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : type === 'error' ? '#FCEBEB' : '#E6F1FB', border: `0.5px solid ${type === 'success' ? '#b0d890' : type === 'error' ? '#f0b0b0' : '#a0c0e8'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : type === 'error' ? '#791F1F' : '#0C447C', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxWidth: 360 }}>
    {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} {msg}
  </div>
);

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('image')) return '🖼️';
  return '📁';
};

const docTypeColour = (type: string) => {
  const map: Record<string, { bg: string; tx: string }> = {
    'Visit form': { bg: '#E6F1FB', tx: '#0C447C' },
    'Consent form': { bg: '#EAF3DE', tx: '#27500A' },
    'ID document': { bg: '#FAECE7', tx: '#712B13' },
    'Medical referral': { bg: '#EEEDFE', tx: '#3C3489' },
    'Intake form': { bg: '#FAEEDA', tx: '#633806' },
    'Other': { bg: '#F1EFE8', tx: '#5F5E5A' },
  };
  return map[type] || map['Other'];
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sel, setSel] = useState<Document | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [orgId, setOrgId] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    beneficiary_id: '',
    caregiver_id: '',
    doc_type: 'Visit form',
    visit_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 5000);
  };

  const loadData = useCallback(async (oid: string) => {
    setLoading(true);
    const [dRes, bRes, cRes] = await Promise.all([
      supabase.from('documents').select('*').eq('org_id', oid).order('created_at', { ascending: false }),
      supabase.from('beneficiaries').select('id, full_name, area').eq('org_id', oid).order('full_name'),
      supabase.from('caregivers').select('id, name, area').eq('org_id', oid).order('name'),
    ]);
    if (dRes.data) setDocuments(dRes.data);
    if (bRes.data) setBeneficiaries(bRes.data);
    if (cRes.data) setCaregivers(cRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setUserId(data.session.user.id);
      const { data: userData } = await supabase
        .from('users').select('org_id, full_name').eq('id', data.session.user.id).single();
      if (userData?.org_id) { setOrgId(userData.org_id); loadData(userData.org_id); }
      else setLoading(false);
    });
  }, [loadData]);

  const handleFileSelect = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      showToast('Only PDF, JPG and PNG files are allowed', 'error'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File must be under 10MB', 'error'); return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    showToast(`${file.name} selected — fill in details and upload`, 'info');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { showToast('Please select a file first', 'error'); return; }
    if (!orgId) { showToast('Organisation not loaded', 'error'); return; }
    setUploading(true);
    setUploadProgress(10);

    try {
      // Create unique storage path
      const ext = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${orgId}/${timestamp}_${safeName}`;

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type,
        });

      if (storageError) {
        // If bucket doesn't exist, show setup message
        if (storageError.message.includes('Bucket not found') || storageError.message.includes('bucket')) {
          showToast('Storage bucket not set up yet — see setup instructions below', 'error');
          setUploading(false);
          setUploadProgress(0);
          return;
        }
        throw storageError;
      }

      setUploadProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      setUploadProgress(85);

      // Save record to database
      const { error: dbError } = await supabase.from('documents').insert({
        org_id: orgId,
        beneficiary_id: form.beneficiary_id || null,
        caregiver_id: form.caregiver_id || null,
        uploaded_by: userId,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        file_url: urlData.publicUrl,
        storage_path: storagePath,
        doc_type: form.doc_type,
        visit_date: form.visit_date,
        notes: form.notes,
        verified: false,
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      showToast(`${selectedFile.name} uploaded and timestamped successfully!`);
      setShowForm(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setForm({ beneficiary_id: '', caregiver_id: '', doc_type: 'Visit form', visit_date: new Date().toISOString().split('T')[0], notes: '' });
      loadData(orgId);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Upload failed: ${error.message}`, 'error');
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const handleVerify = async (doc: Document) => {
    const { error } = await supabase.from('documents').update({
      verified: true,
      verified_by: userId,
      verified_at: new Date().toISOString(),
    }).eq('id', doc.id);
    if (!error) {
      showToast(`${doc.file_name} marked as verified!`);
      loadData(orgId);
      if (sel?.id === doc.id) setSel({ ...doc, verified: true, verified_by: userId, verified_at: new Date().toISOString() });
    } else {
      showToast('Failed to verify', 'error');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete ${doc.file_name}? This cannot be undone.`)) return;
    // Delete from storage
    await supabase.storage.from('documents').remove([doc.storage_path]);
    // Delete from database
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (!error) {
      showToast(`${doc.file_name} deleted`);
      if (sel?.id === doc.id) setSel(null);
      loadData(orgId);
    } else {
      showToast('Failed to delete', 'error');
    }
  };

  const exportDocumentReport = async () => {
    showToast('Generating PDF report...', 'info');
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('en-ZA');

    // Header
    doc.setFillColor(216, 90, 48);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Upload Register', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${date} · NpoDesk · npodesk.co.za`, 14, 21);

    doc.setTextColor(0, 0, 0);

    // Summary stats
    const verified = documents.filter(d => d.verified).length;
    const pending = documents.filter(d => !d.verified).length;

    autoTable(doc, {
      startY: 36,
      body: [
        ['Total documents', documents.length.toString(), 'Verified', verified.toString()],
        ['Pending review', pending.toString(), 'Visit forms', documents.filter(d => d.doc_type === 'Visit form').length.toString()],
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [250, 236, 231], textColor: [113, 43, 19] },
        2: { fontStyle: 'bold', fillColor: [250, 236, 231], textColor: [113, 43, 19] },
      },
    });

    // Documents table
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(216, 90, 48);
    doc.text(`All Documents (${documents.length})`, 14, finalY);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['File Name', 'Type', 'Beneficiary', 'Caregiver', 'Visit Date', 'Size', 'Status']],
      body: documents.map(d => {
        const ben = beneficiaries.find(b => b.id === d.beneficiary_id);
        const cg = caregivers.find(c => c.id === d.caregiver_id);
        return [
          d.file_name,
          d.doc_type,
          ben?.full_name || '—',
          cg?.name || '—',
          d.visit_date || '—',
          formatSize(d.file_size),
          d.verified ? 'Verified ✓' : 'Pending',
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [216, 90, 48], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        6: { textColor: [100, 100, 100] as [number, number, number] }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.text(`Document Register · NpoDesk · npodesk.co.za · Page ${i} of ${pageCount}`, pageW / 2, 290, { align: 'center' });
    }

    doc.save(`document_register_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Document register PDF downloaded!');
  };

  const exportCSV = () => {
    if (documents.length === 0) { showToast('No documents to export', 'error'); return; }
    const headers = ['File Name', 'Type', 'Document Type', 'Beneficiary', 'Caregiver', 'Visit Date', 'File Size', 'Verified', 'Uploaded', 'Notes'];
    const rows = documents.map(d => {
      const ben = beneficiaries.find(b => b.id === d.beneficiary_id);
      const cg = caregivers.find(c => c.id === d.caregiver_id);
      return [
        `"${d.file_name}"`, `"${d.file_type}"`, `"${d.doc_type}"`,
        `"${ben?.full_name || 'N/A'}"`, `"${cg?.name || 'N/A'}"`,
        `"${d.visit_date}"`, `"${formatSize(d.file_size)}"`,
        `"${d.verified ? 'Yes' : 'No'}"`,
        `"${new Date(d.created_at).toLocaleString('en-ZA')}"`,
        `"${(d.notes || '').replace(/"/g, "'")}"`
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `documents_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${documents.length} document records`);
  };

  const filtered = documents.filter(d =>
    (!search || d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.notes || '').toLowerCase().includes(search.toLowerCase()) ||
      (beneficiaries.find(b => b.id === d.beneficiary_id)?.full_name || '').toLowerCase().includes(search.toLowerCase())) &&
    (!typeF || d.doc_type === typeF)
  );

  const benName = (id: string | null) => beneficiaries.find(b => b.id === id)?.full_name || '—';
  const cgName = (id: string | null) => caregivers.find(c => c.id === id)?.name || '—';

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div>
          <div className="page-title">Document uploads</div>
          <div className="page-sub">Signed visit forms, consent docs & field records</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <button className="btn btn-sm" onClick={exportCSV}>⬇ CSV log</button>
          <button className="btn btn-sm" onClick={exportDocumentReport}>📄 PDF report</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '⬆ Upload document'}
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {[
          { label: '📁 Total documents', value: documents.length.toString(), delta: 'All uploads' },
          { label: '✅ Verified', value: documents.filter(d => d.verified).length.toString(), delta: 'Confirmed by admin' },
          { label: '⏳ Pending review', value: documents.filter(d => !d.verified).length.toString(), delta: 'Awaiting verification' },
          { label: '📄 Visit forms', value: documents.filter(d => d.doc_type === 'Visit form').length.toString(), delta: 'Field visits' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className={`metric-delta ${m.label.includes('Pending') && parseInt(m.value) > 0 ? 'delta-warn' : 'delta-up'}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Setup instructions if no documents yet */}
      {!loading && documents.length === 0 && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid #185FA5' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>⚙️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#185FA5', marginBottom: 8 }}>One-time Supabase setup required</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>Run this SQL in Supabase SQL Editor, then create a storage bucket named <strong>documents</strong>:</div>
              <div style={{ background: '#1C1410', borderRadius: 8, padding: '12px 14px', fontSize: 11, color: '#e0d8d0', fontFamily: 'monospace', lineHeight: 1.8, marginBottom: 10, overflowX: 'auto', whiteSpace: 'pre' }}>
{`create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references organisations,
  beneficiary_id uuid references beneficiaries,
  caregiver_id uuid references caregivers,
  uploaded_by uuid,
  file_name text not null,
  file_type text,
  file_size bigint,
  file_url text,
  storage_path text,
  doc_type text default 'Visit form',
  visit_date date,
  notes text,
  verified boolean default false,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
alter table documents enable row level security;
create policy "documents_access" on documents
  for all using (true) with check (true);`}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Then in Supabase:</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>
                1. Go to <strong>Storage</strong> in left menu<br />
                2. Click <strong>New bucket</strong><br />
                3. Name it exactly: <strong>documents</strong><br />
                4. Tick <strong>Public bucket</strong><br />
                5. Click <strong>Save</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#D85A30' }}>⬆ Upload signed document</div>
          <form onSubmit={handleUpload}>

            {/* Drag & drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? '#D85A30' : selectedFile ? '#1D9E75' : 'rgba(0,0,0,0.15)'}`, borderRadius: 10, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#FAECE7' : selectedFile ? '#F0FBF6' : '#FAFAF8', marginBottom: 16, transition: 'all 0.2s' }}>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
              {selectedFile ? (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{fileIcon(selectedFile.type)}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1D9E75' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{formatSize(selectedFile.size)} · {selectedFile.type}</div>
                  {previewUrl && <img src={previewUrl} alt="Preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, marginTop: 10, objectFit: 'contain' }} />}
                  <div style={{ fontSize: 11, color: '#D85A30', marginTop: 8, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}>✕ Remove file</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📎</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Drag & drop or click to select</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>PDF, JPG or PNG · Max 10MB</div>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Document type *</label>
                <select className="form-input" value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })}>
                  {['Visit form', 'Consent form', 'ID document', 'Medical referral', 'Intake form', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Visit / document date *</label>
                <input className="form-input" type="date" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Linked beneficiary</label>
                <select className="form-input" value={form.beneficiary_id} onChange={e => setForm({ ...form, beneficiary_id: e.target.value })}>
                  <option value="">Not linked to a beneficiary</option>
                  {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.full_name} — {b.area}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Uploaded by (caregiver)</label>
                <select className="form-input" value={form.caregiver_id} onChange={e => setForm({ ...form, caregiver_id: e.target.value })}>
                  <option value="">Select caregiver</option>
                  {caregivers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.area}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Visit summary, observations, or document notes..." />
            </div>

            {/* POPIA consent notice */}
            <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" required style={{ marginTop: 2, accentColor: '#185FA5', flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: '#0C447C', lineHeight: 1.5 }}>
                <strong>POPIA consent:</strong> I confirm that the beneficiary has consented to the collection and storage of this document, and that it is being uploaded for legitimate organisational purposes in line with the Protection of Personal Information Act (POPIA) No. 4 of 2013.
              </div>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#555' }}>Uploading...</span>
                  <span style={{ color: '#D85A30', fontWeight: 500 }}>{uploadProgress}%</span>
                </div>
                <div style={{ background: '#F0EDE8', borderRadius: 99, height: 6 }}>
                  <div style={{ width: `${uploadProgress}%`, height: 6, borderRadius: 99, background: '#D85A30', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            <div className="flex-gap">
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowForm(false); setSelectedFile(null); setPreviewUrl(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={uploading || !selectedFile}>
                {uploading ? `⏳ Uploading ${uploadProgress}%...` : '⬆ Upload & timestamp'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input placeholder="Search by file name, beneficiary or notes..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All types</option>
          {['Visit form', 'Consent form', 'ID document', 'Medical referral', 'Intake form', 'Other'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="two-col">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading documents...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {documents.length === 0 ? '📁 No documents yet — upload the first signed form above!' : 'No results found'}
            </div>
          ) : (
            <table>
              <thead><tr>
                <th style={{ width: '28%' }}>File</th>
                <th style={{ width: '16%' }}>Type</th>
                <th style={{ width: '18%' }}>Beneficiary</th>
                <th style={{ width: '16%' }}>Visit date</th>
                <th style={{ width: '12%' }}>Size</th>
                <th style={{ width: '12%' }}>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(d => {
                  const dtc = docTypeColour(d.doc_type);
                  return (
                    <tr key={d.id} className={sel?.id === d.id ? 'selected' : ''} onClick={() => setSel(d)}>
                      <td>
                        <div className="name-cell">
                          <span style={{ fontSize: 18 }}>{fileIcon(d.file_type)}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{d.file_name}</div>
                            <div style={{ fontSize: 10, color: '#aaa' }}>{new Date(d.created_at).toLocaleString('en-ZA')}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="pill" style={{ background: dtc.bg, color: dtc.tx, fontSize: 10 }}>{d.doc_type}</span></td>
                      <td style={{ fontSize: 11 }}>{benName(d.beneficiary_id)}</td>
                      <td style={{ fontSize: 11, color: '#888' }}>{d.visit_date}</td>
                      <td style={{ fontSize: 11, color: '#888' }}>{formatSize(d.file_size)}</td>
                      <td>
                        {d.verified
                          ? <span className="pill pill-green">✅ Verified</span>
                          : <span className="pill pill-amber">⏳ Pending</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {sel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card">
              {/* File preview */}
              <div style={{ background: '#FAFAF8', borderRadius: 8, padding: '1rem', textAlign: 'center', marginBottom: 14 }}>
                {sel.file_type.startsWith('image/') ? (
                  <img src={sel.file_url} alt={sel.file_name} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
                )}
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 8 }}>{sel.file_name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{formatSize(sel.file_size)} · {sel.file_type}</div>
              </div>

              {/* Timestamp badge */}
              <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🕐</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#3C3489' }}>Uploaded & timestamped</div>
                  <div style={{ fontSize: 11, color: '#534AB7' }}>{new Date(sel.created_at).toLocaleString('en-ZA')}</div>
                </div>
              </div>

              {[
                ['Document type', sel.doc_type],
                ['Beneficiary', benName(sel.beneficiary_id)],
                ['Caregiver', cgName(sel.caregiver_id)],
                ['Visit date', sel.visit_date],
                ['File size', formatSize(sel.file_size)],
                ['Verified', sel.verified ? `Yes — ${sel.verified_at ? new Date(sel.verified_at).toLocaleDateString('en-ZA') : ''}` : 'Not yet verified'],
              ].map(([l, v]) => (
                <div key={l} className="d-row">
                  <span className="d-label">{l}</span>
                  <span className="d-value" style={{ fontSize: 11 }}>{v}</span>
                </div>
              ))}

              {sel.notes && (
                <>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 500, margin: '10px 0 4px' }}>Notes</div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, background: '#FAFAF8', borderRadius: 6, padding: '8px 10px' }}>{sel.notes}</div>
                </>
              )}

              <div className="flex-gap" style={{ marginTop: 14 }}>
                <a href={sel.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
                  👁 View
                </a>
                <a
                  href={sel.file_url}
                  download={sel.file_name}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                  onClick={async () => {
                    // For cross-origin files, fetch and force download
                    try {
                      const response = await fetch(sel.file_url);
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = sel.file_name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast(`${sel.file_name} downloaded!`);
                    } catch {
                      // Fallback — open in new tab
                      window.open(sel.file_url, '_blank');
                      showToast('Opening file for download...', 'info');
                    }
                  }}
                >
                  ⬇ Download
                </a>
              </div>
              <div className="flex-gap" style={{ marginTop: 8 }}>
                {!sel.verified && (
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleVerify(sel)}>
                    ✅ Verify
                  </button>
                )}
                <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#791F1F' }} onClick={() => handleDelete(sel)}>
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* Verification record */}
            {sel.verified && (
              <div className="card" style={{ border: '1px solid #b0d890' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#27500A' }}>Document verified</div>
                </div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                  This document has been reviewed and verified by an authorised admin.<br />
                  {sel.verified_at && <><strong>Verified at:</strong> {new Date(sel.verified_at).toLocaleString('en-ZA')}</>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
            <div style={{ textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📁</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>No document selected</div>
              <div style={{ fontSize: 12 }}>Click a document to view details, verify or download</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
