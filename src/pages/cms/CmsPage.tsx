import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useToast } from '../../components/common/ToastHost';
import { resourceConfigs, type FieldConfig } from './resource-config';

type Row = Record<string, any> & { id: string };

export function CmsPage() {
  const { resource = '' } = useParams();
  const config = resourceConfigs[resource];
  const { pushToast } = useToast();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const columns = useMemo(() => {
    if (!items[0]) return [];
    return Object.keys(items[0]).filter((key) => !['id', 'createdAt', 'updatedAt'].includes(key)).slice(0, 4);
  }, [items]);

  const load = async () => {
    if (!resource) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/${resource}`, { params: { q: query, page, limit: 10 } });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [resource, query, page]);

  useEffect(() => {
    setForm(editing ? { ...editing } : {});
  }, [editing]);

  if (!config) {
    return <div className="rounded-[16px] border border-dashed border-slate-300 p-6 text-slate-500">Unknown resource.</div>;
  }

  const submit = async () => {
    const payload = { ...form };
    for (const field of config.fields) {
      if (field.type === 'number' && payload[field.name] !== undefined && payload[field.name] !== '') {
        payload[field.name] = Number(payload[field.name]);
      }
      if (field.type === 'checkbox') payload[field.name] = Boolean(payload[field.name]);
    }
    try {
      if (editing) {
        await apiClient.put(`/${resource}/${editing.id}`, payload);
        pushToast(`${config.title} updated`, 'success');
      } else {
        await apiClient.post(`/${resource}`, payload);
        pushToast(`${config.title} created`, 'success');
      }
      setEditing(null);
      setForm({});
      await load();
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Save failed', 'error'); }
  };

  const remove = async (id: string) => {
    if (!window.confirm(`Delete this ${config.title.toLowerCase()}?`)) return;
    try {
      await apiClient.delete(`/${resource}/${id}`);
      pushToast(`${config.title} deleted`, 'success');
      await load();
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Delete failed', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{config.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={config.searchPlaceholder} />
          <Button variant="secondary" onClick={() => { setEditing(null); setForm({}); }}>
            New
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2">
        {config.fields.map((field) => (
          <Field key={field.name} field={field} value={form[field.name] ?? ''} onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} />
        ))}
        <div className="md:col-span-2 flex gap-3">
          <Button onClick={submit} disabled={loading}>{editing ? 'Update' : 'Create'}</Button>
          {editing ? <Button variant="secondary" onClick={() => { setEditing(null); setForm({}); }}>Cancel</Button> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-soft">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{column}</th>)}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                {columns.map((column) => <td key={column} className="px-4 py-3 text-sm text-slate-700">{String(item[column] ?? '')}</td>)}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(item.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <div className="p-6 text-sm text-slate-500">No records found.</div> : null}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Page {page} of {Math.max(1, Math.ceil(total / 10))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="secondary" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ field, value, onChange }: { field: FieldConfig; value: any; onChange: (value: any) => void }) {
  const common = { value, onChange: (e: any) => onChange(e.target.value), placeholder: field.label, className: 'min-w-0' };
  return (
    <label className="space-y-1 md:col-span-1">
      <span className="text-sm font-medium text-slate-700">{field.label}</span>
      {field.type === 'textarea' ? (
        <TextArea {...common} />
      ) : field.type === 'select' ? (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      ) : field.type === 'number' ? (
        <Input type="number" {...common} />
      ) : field.type === 'checkbox' ? (
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
      ) : (
        <Input type="text" {...common} />
      )}
    </label>
  );
}
