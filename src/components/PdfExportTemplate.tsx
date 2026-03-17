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
    mail,
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

  const formatCurrencyNumber = (val: number) => {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  const formatCurrency = (val: number) => {
    return '$' + formatCurrencyNumber(val);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      if (dateString.includes('-') && !dateString.includes('T')) {
        const [year, month, day] = dateString.split('-');
        return `${parseInt(day)}/${parseInt(month)}/${year}`;
      }
      return format(new Date(dateString), 'd/M/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const today = format(new Date(), 'd/M/yyyy');

  return (
    <div className="pdf-export-template" style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '794px', minHeight: '1123px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
      <div 
        ref={ref}
        className="bg-[#ffffff] font-sans"
        style={{ 
          width: '794px',
          minHeight: '1123px',
          padding: '40px 60px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          color: '#4b5563'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-4xl font-bold italic text-[#6b7280] tracking-tight mb-1">PRESUPUESTO</h1>
            <div className="text-3xl font-bold text-[#15803d] mb-6">N° {correlativeNumber}</div>
            
            <div className="text-sm font-bold text-[#374151] uppercase mb-1">CLIENTE:</div>
            <div className="text-lg text-[#374151]">{cliente || '-'}</div>
          </div>
          <div className="text-right flex flex-col items-end justify-center">
            <img src="/logo.png" alt="Grupo Fono Bus" className="h-16 object-contain mb-1" />
            <div className="text-[10px] font-bold text-[#374151] mb-2">EMPRENDIMIENTOS SRL.</div>
            <div className="text-xs text-[#6b7280] space-y-1">
              <div>Dirección: Sierras Grandes 21 - B° Yapeyú - Córdoba.</div>
              <div>Correo: viajesespeciales@grupofonobus.com.ar</div>
              <div>Telefono: 351-6617222</div>
            </div>
          </div>
        </div>
        
        <div className="border-b-2 border-[#15803d] mb-6"></div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs text-[#374151]">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase w-24">CONTACTO:</span>
            <span>{contacto || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase w-24">FECHA:</span>
            <span>{today}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase w-24">TELEFONO:</span>
            <span>{telefono || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase w-24">EMAIL:</span>
            <span>{mail || '-'}</span>
          </div>
        </div>

        {/* Condiciones del Viaje */}
        <div className="bg-[#c1e1c5] px-2 py-1 mb-4">
          <h3 className="text-xs font-bold text-[#374151] uppercase">CONDICIONES DEL VIAJE</h3>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8 text-xs">
          <div className="flex items-center">
            <div className="bg-[#c1e1c5] px-2 py-1 font-bold text-[#374151] w-32 border border-[#c1e1c5]">FECHA SALIDA:</div>
            <div className="px-2 py-1 border border-[#d1d5db] flex-1 text-center bg-white">{formatDate(fechaSalida) || '-'}</div>
          </div>
          <div className="flex items-center">
            <div className="bg-[#c1e1c5] px-2 py-1 font-bold text-[#374151] w-32 border border-[#c1e1c5]">HORA SALIDA:</div>
            <div className="px-2 py-1 border border-[#d1d5db] flex-1 text-center bg-white">{formatTime(horaSalida) || '-'}</div>
          </div>
          <div className="flex items-center">
            <div className="bg-[#c1e1c5] px-2 py-1 font-bold text-[#374151] w-32 border border-[#c1e1c5]">FECHA REGRESO:</div>
            <div className="px-2 py-1 border border-[#d1d5db] flex-1 text-center bg-white">{formatDate(fechaRegreso) || '-'}</div>
          </div>
          <div className="flex items-center">
            <div className="bg-[#c1e1c5] px-2 py-1 font-bold text-[#374151] w-32 border border-[#c1e1c5]">HORA REGRESO:</div>
            <div className="px-2 py-1 border border-[#d1d5db] flex-1 text-center bg-white">{formatTime(horaRegreso) || '-'}</div>
          </div>
        </div>

        {/* Locations */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex flex-col gap-6 w-5/12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] font-bold text-[#6b7280] uppercase">ORIGEN</div>
                <div className="text-base font-semibold text-[#374151]">{origen || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fef3c7] flex items-center justify-center text-[#d97706] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] font-bold text-[#6b7280] uppercase">REGRESO A</div>
                <div className="text-base font-semibold text-[#374151]">{regresoA || '-'}</div>
              </div>
            </div>
          </div>
          
          <div className="text-[#cbd5e1] w-2/12 flex justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>

          <div className="flex items-center gap-3 w-5/12">
            <div className="w-8 h-8 rounded-full bg-[#dbeafe] flex items-center justify-center text-[#2563eb] shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-[10px] font-bold text-[#6b7280] uppercase">DESTINO</div>
              <div className="text-base font-semibold text-[#374151]">{destino || '-'}</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border-t-2 border-b-2 border-[#15803d] mb-4">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="text-left py-2 px-2 font-bold text-[#374151] uppercase w-1/2 align-middle">DESCRIPCION DEL SERVICIO</th>
                <th className="text-center py-2 px-2 font-bold text-[#374151] uppercase w-1/6 align-middle">PRECIO</th>
                <th className="text-center py-2 px-2 font-bold text-[#374151] uppercase w-1/6 align-middle">CANT.</th>
                <th className="text-right py-2 px-2 font-bold text-[#374151] uppercase w-1/6 align-middle">TOTAL</th>
              </tr>
            </thead>
          </table>
        </div>
        
        <table className="w-full text-sm mb-12" style={{ tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td className="py-2 px-2 text-[#6b7280] w-1/2 align-middle">{descripcion || 'Traslado privado'}</td>
              <td className="py-2 px-2 text-center text-[#6b7280] w-1/6 align-middle">
                <div className="flex justify-between"><span>$</span><span>{formatCurrencyNumber(finalTotal)}</span></div>
              </td>
              <td className="py-2 px-2 text-center text-[#6b7280] w-1/6 align-middle">1</td>
              <td className="py-2 px-2 text-right text-[#6b7280] w-1/6 align-middle">
                <div className="flex justify-between"><span>$</span><span>{formatCurrencyNumber(finalTotal)}</span></div>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-2 text-[#6b7280] w-1/2 align-middle"></td>
              <td className="py-2 px-2 text-center text-[#6b7280] w-1/6 align-middle">
                <div className="flex justify-between"><span>$</span><span>-</span></div>
              </td>
              <td className="py-2 px-2 text-center text-[#6b7280] w-1/6 align-middle">0</td>
              <td className="py-2 px-2 text-right text-[#6b7280] w-1/6 align-middle">
                <div className="flex justify-between"><span>$</span><span>-</span></div>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-2 text-[#6b7280] w-1/2 align-middle"></td>
              <td className="py-2 px-2 text-center text-[#6b7280] w-1/6 align-middle">
                <div className="flex justify-between"><span>$</span><span>-</span></div>
              </td>
              <td className="py-2 px-2 text-center text-[#6b7280] w-1/6 align-middle">0</td>
              <td className="py-2 px-2 text-right text-[#6b7280] w-1/6 align-middle">
                <div className="flex justify-between"><span>$</span><span>-</span></div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#6b7280]">Cantidad de pasajeros</span>
            <span className="text-[#dc2626] font-medium">{passengers}</span>
          </div>
          
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between items-center font-bold text-[#374151] px-2">
              <span>SUB.TOTAL:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-[#374151] px-2">
              <span>DESC.: (%)</span>
              <span>0,0%</span>
            </div>
            <div className="flex justify-between items-center font-bold text-[#374151] bg-[#c1e1c5] px-2 py-1 -mx-2">
              <span>TOTAL (iva incl):</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="space-y-1 mb-8">
          <div className="bg-[#c1e1c5] border border-[#15803d] py-1 flex justify-center items-center">
            <span className="font-bold italic text-[#374151]">La cotización tiene una validez de 15 días.</span>
          </div>
          <div className="bg-[#c1e1c5] border border-[#15803d] py-1 flex justify-center items-center">
            <span className="font-bold italic text-[#374151]">Tarifas y disponibilidad sujetas a confirmación</span>
          </div>
        </div>

        <div className="text-[10px] text-[#6b7280] italic space-y-1">
          <p>IMPORTANTE: LOS VIAJES DEBERAN SER ABONADOS CON UN MINIMO DE 72 hs ANTES DE LA FECHA PACTADA.</p>
          <p>LA FORMA DE PAGO ES MEDIANTE DEPOSITO BANCARIO, EL CUAL SE DEBERA ENVIAR COMPROBANTE DE PAGO POR CORREO ELECTRONICO Y/O WHATSAPP AL NUMERO 351-6617222</p>
        </div>
      </div>
    </div>
  );
});

PdfExportTemplate.displayName = 'PdfExportTemplate';

export default PdfExportTemplate;
