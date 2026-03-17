import React, { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const productos = ['Panel Calefactor Slim','Panel Calefactor Firenze','Calefones','Calderas','Accesorios'];

const modelosPorProducto = {
  'Panel Calefactor Slim': ['250W','250W TS','250W TD','250W MB','500W','500W TS','500W TD','500W MB'],
  'Panel Calefactor Firenze': ['1400W BL','1400W MV','1400W PA','1400W PR','1400W MTV','1400W PCL','1400W MCO','1400W Smart'],
  Calefones: ['One','Nova Gris','Nova Negro','Nova Blanco','Pulse 318','Pulse 324'],
  Calderas: ['Core 14,4','Core 23 380V'],
  Accesorios: ['Barral 250','Barral 500'],
};

const motivosPorProducto = {
  'Panel Calefactor Slim': ['No calienta','Calienta poco','Falla eléctrica','Golpe transporte','Error instalación','Ruido'],
  'Panel Calefactor Firenze': ['No calienta','Calienta poco','Falla eléctrica','Golpe transporte','Error instalación','Ruido'],
  Calefones: ['No calienta agua','Pierde agua','Falla eléctrica','Error instalación','Golpe transporte'],
  Calderas: ['No enciende','Falla electrónica','Error instalación','Golpe transporte'],
  Accesorios: ['Medida incorrecta','Golpe transporte','Producto equivocado'],
};

function generarTrackingId() {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `DEV-${y}${m}${d}-${rand}`;
}

async function subirArchivo(file, trackingId, folder) {
  if (!supabase || !file) return null;
  const path = `${folder}/${trackingId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('devoluciones').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('devoluciones').getPublicUrl(path);
  return data.publicUrl;
}

export default function App() {
  const [form, setForm] = useState({producto:'',modelo:'',motivo:'',descripcionFalla:''});
  const [trackingId, setTrackingId] = useState('');

  const modelos = useMemo(()=>modelosPorProducto[form.producto]||[],[form.producto]);
  const motivos = useMemo(()=>motivosPorProducto[form.producto]||[],[form.producto]);

  const onSubmit = async (e)=>{
    e.preventDefault();
    if(!supabase){ alert("Faltan variables"); return;}
    const id = generarTrackingId();
    await supabase.from('devoluciones').insert({tracking_id:id,producto:form.producto,modelo:form.modelo,motivo:form.motivo,descripcion_falla:form.descripcionFalla});
    setTrackingId(id);
  }

  return (
    <div style={{padding:20}}>
      <h2>Portal TempTech</h2>
      {trackingId && <p>ID: {trackingId}</p>}
      <form onSubmit={onSubmit}>
        <select onChange={e=>setForm({...form,producto:e.target.value})}>
          <option>Producto</option>
          {productos.map(p=><option key={p}>{p}</option>)}
        </select>
        <select onChange={e=>setForm({...form,modelo:e.target.value})}>
          {modelos.map(m=><option key={m}>{m}</option>)}
        </select>
        <select onChange={e=>setForm({...form,motivo:e.target.value})}>
          {motivos.map(m=><option key={m}>{m}</option>)}
        </select>
        <textarea onChange={e=>setForm({...form,descripcionFalla:e.target.value})}/>
        <button>Enviar</button>
      </form>
    </div>
  );
}