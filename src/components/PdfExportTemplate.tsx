import React, { forwardRef } from 'react';
import { format } from 'date-fns';

type PdfExportTemplateProps = {
  correlativeNumber: string;
  cliente: string;
  contacto: string;
  telefono: string;
  mail: string;
  origen: string;
  destino: string;
  regresoA: string;
  fechaSalida: string;
  horaSalida: string;
  fechaRegreso: string;
  horaRegreso: string;
  descripcion: string;
  passengers: number;
  subtotal: number;
  ivaAmount: number;
  finalTotal: number;
};

const PdfExportTemplate = forwardRef<HTMLDivElement, PdfExportTemplateProps>((props, ref) => {
  const {
    correlativeNumber,
    cliente,
    contacto,
    telefono,
    origen,
    destino,
    regresoA,
    fechaSalida,
    horaSalida,
    fechaRegreso,
    horaRegreso,
    descripcion,
    passengers,
    subtotal,
    ivaAmount,
    finalTotal
  } = props;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // If it's just a date string like YYYY-MM-DD, we can just split it and reformat
      if (dateString.includes('-') && !dateString.includes('T')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString; // It will already be in HH:mm format from type="time"
  };

  const today = format(new Date(), 'dd/MM/yyyy');

  return (
    <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '800px' }}>
      <div 
        ref={ref}
        className="bg-white p-10 font-sans text-slate-800"
        style={{ 
          width: '800px', 
          minHeight: '1131px', // A4 ratio
          backgroundColor: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
      <div className="flex justify-between items-start mb-10 border-b-2 border-green-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">PRESUPUESTO</h1>
          <div className="text-2xl font-bold text-green-700 mb-4">N° {correlativeNumber}</div>
          <div className="text-xl text-slate-700 mb-6">Viaje Especial</div>
          
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CLIENTE:</div>
          <div className="text-xl font-semibold">{cliente || '-'}</div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center justify-end mb-4">
            <img src="/logo.svg" alt="Grupo Fono Bus" className="h-12 object-contain" />
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            <div>Sierras Grandes 21</div>
            <div>B° Yapeyu - Córdoba</div>
            <div className="text-green-700 font-medium">viajesespeciales@grupofonobus.com.ar</div>
            <div className="font-bold text-slate-800">Tel: 351-6617222</div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-4 w-1/2">
          <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-24">CONTACTO:</span>
            <span className="text-lg">{contacto || '-'}</span>
          </div>
          <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-24">TELÉFONO:</span>
            <span className="text-lg">{telefono || '-'}</span>
          </div>
        </div>
        <div className="flex items-end gap-2 border-b border-slate-300 pb-1 w-48">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FECHA:</span>
          <span className="text-lg text-right flex-1">{today}</span>
        </div>
      </div>

      {/* Trip Conditions */}
      <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">CONDICIONES DEL VIAJE</h3>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase w-28">FECHA SALIDA:</span>
            <span className="font-medium">{formatDate(fechaSalida) || '-'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase w-28">HORA SALIDA:</span>
            <span className="font-medium">{formatTime(horaSalida) || '-'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase w-28">FECHA REGRESO:</span>
            <span className="font-medium">{formatDate(fechaRegreso) || '-'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase w-28">HORA REGRESO:</span>
            <span className="font-medium">{formatTime(horaRegreso) || '-'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">ORIGEN</div>
              <div className="font-semibold text-slate-900">{origen || '-'}</div>
            </div>
          </div>
          
          <div className="text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">DESTINO</div>
              <div className="font-semibold text-slate-900">{destino || '-'}</div>
            </div>
          </div>

          <div className="text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">REGRESO A</div>
              <div className="font-semibold text-slate-900">{regresoA || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-slate-200">
            <th className="text-left py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300">DESCRIPCIÓN DEL SERVICIO</th>
            <th className="text-center py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 w-32">CANTIDAD</th>
            <th className="text-right py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 w-48">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-4 px-4 border border-slate-300 text-slate-800">{descripcion || 'Traslado especial'}</td>
            <td className="py-4 px-4 border border-slate-300 text-center text-slate-800">1</td>
            <td className="py-4 px-4 border border-slate-300 text-right font-medium text-slate-800">{formatCurrency(finalTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-80 space-y-3">
          <div className="flex justify-between items-center text-slate-600">
            <span>Cantidad de pasajeros:</span>
            <span className="font-medium text-slate-800">{passengers}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>SUB.TOTAL:</span>
            <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>IVA (10.5%):</span>
            <span className="font-medium text-slate-800">{formatCurrency(ivaAmount)}</span>
          </div>
          <div className="flex justify-between items-center bg-green-100 border-2 border-green-600 p-3 rounded-lg mt-4">
            <span className="font-bold text-green-800">TOTAL (Iva incl):</span>
            <span className="font-bold text-xl text-green-800">{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="bg-green-50 p-6 rounded-xl text-center mb-8">
        <div className="font-medium text-green-800 mb-2">La cotización tiene una validez de 15 días.</div>
        <div className="font-medium text-green-800">Tarifas y disponibilidad sujetas a confirmación</div>
      </div>

      <div className="text-xs text-slate-500 space-y-2 border-t border-slate-200 pt-6">
        <p><strong className="text-slate-700">IMPORTANTE:</strong> LOS VIAJES DEBERÁN SER ABONADOS CON UN MÍNIMO DE 72 hs ANTES DE LA FECHA PACTADA.</p>
        <p>LA FORMA DE PAGO ES MEDIANTE DEPÓSITO BANCARIO, EL CUAL SE DEBERÁ ENVIAR COMPROBANTE DE PAGO POR CORREO ELECTRÓNICO Y/O WHATSAPP AL NÚMERO 351-6617222</p>
      </div>
    </div>
    </div>
  );
});

PdfExportTemplate.displayName = 'PdfExportTemplate';

export default PdfExportTemplate;
