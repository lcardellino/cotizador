import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';

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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(val);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      if (dateString.includes('-') && !dateString.includes('T')) {
        const [year, month, day] = dateString.split('-');
        return `${parseInt(day)}/${parseInt(month)}/${year}`;
      }
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const today = format(new Date(), 'dd/MM/yyyy');

  return (
    <div className="pdf-export-template" style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '794px', height: '1120px', overflow: 'hidden', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
      <div 
        ref={ref}
        className="font-sans"
        style={{ 
          width: '794px',
          height: '1120px',
          overflow: 'hidden',
          padding: '40px 60px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-[#059669]">
          {/* Left side - Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-[#0f172a] mb-2">PRESUPUESTO</h1>
            {correlativeNumber && (
              <p className="text-xl text-[#047857] font-bold mb-2">N° {correlativeNumber}</p>
            )}
            <h2 className="text-lg text-[#475569] font-semibold mb-3">Viaje Especial</h2>
            {cliente && cliente !== "Sin Cliente" && (
              <div className="mt-4">
                <p className="text-xs text-[#64748b] uppercase font-semibold">CLIENTE:</p>
                <p className="text-lg text-[#1e293b] font-semibold">{cliente}</p>
              </div>
            )}
          </div>
          
          {/* Right side - Logo and company data */}
          <div className="w-1/3 text-right">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698676368b524ebad3f64115/e9455546d_Logo-Fono-Bus-2222para-usarcopiacopia.png"
              alt="FonoBus"
              className="w-full h-auto mb-4 ml-auto"
            />
            <div className="space-y-1">
              <p className="text-xs text-[#475569] font-medium"><span className="text-[#64748b]">Dirección:</span> Sierras Grandes 21</p>
              <p className="text-xs text-[#475569] font-medium">B° Yapeyú - Córdoba.</p>
              <p className="text-xs text-[#047857] font-semibold mt-2">viajesespeciales@grupofonobus.com.ar</p>
              <p className="text-xs text-[#334155] font-bold"><span className="text-[#64748b] font-medium">Teléfono:</span> 351-6617222</p>
            </div>
          </div>
        </div>

        {/* Contact and Date */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="space-y-4">
            {contacto && (
              <div className="flex items-center">
                <span className="text-xs text-[#64748b] uppercase font-semibold w-24">CONTACTO:</span>
                <span className="text-sm text-[#1e293b]">
                  {contacto}
                </span>
              </div>
            )}
            {telefono && (
              <div className="flex items-center">
                <span className="text-xs text-[#64748b] uppercase font-semibold w-24">TELÉFONO:</span>
                <span className="text-sm text-[#1e293b]">
                  {telefono}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-xs text-[#64748b] uppercase font-semibold w-24">FECHA:</span>
              <span className="text-sm text-[#1e293b]">
                {today}
              </span>
            </div>
            {mail && (
              <div className="flex items-center">
                <span className="text-xs text-[#64748b] uppercase font-semibold w-24">EMAIL:</span>
                <span className="text-sm text-[#1e293b]">
                  {mail}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-[#f8fafc] rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold text-[#334155] uppercase mb-3 border-b border-[#e2e8f0] pb-2">
            Condiciones del Viaje
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {fechaSalida && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#059669]" />
                  <span className="text-xs text-[#64748b] uppercase font-semibold">Fecha Salida:</span>
                  <span className="text-sm text-[#1e293b] font-medium">
                    {formatDate(fechaSalida)}
                  </span>
                </div>
              )}
              {fechaRegreso && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#059669]" />
                  <span className="text-xs text-[#64748b] uppercase font-semibold">Fecha Regreso:</span>
                  <span className="text-sm text-[#1e293b] font-medium">
                    {formatDate(fechaRegreso)}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {horaSalida && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#059669]" />
                  <span className="text-xs text-[#64748b] uppercase font-semibold">Hora Salida:</span>
                  <span className="text-sm text-[#1e293b] font-medium">{horaSalida}</span>
                </div>
              )}
              {horaRegreso && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#059669]" />
                  <span className="text-xs text-[#64748b] uppercase font-semibold">Hora Regreso:</span>
                  <span className="text-sm text-[#1e293b] font-medium">{horaRegreso}</span>
                </div>
              )}
            </div>
          </div>

          {/* Route visualization */}
          {(origen || destino || regresoA) && (
            <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
              <div className="flex items-center justify-between gap-2">
                {origen && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-10 w-10 rounded-full bg-[#d1fae5] flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-[#059669]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b] uppercase font-semibold">Origen</p>
                      <p className="text-sm font-semibold text-[#1e293b]">{origen}</p>
                    </div>
                  </div>
                )}
                <ArrowRight className="h-5 w-5 text-[#cbd5e1] flex-shrink-0" />
                {destino && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-10 w-10 rounded-full bg-[#dbeafe] flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-[#2563eb]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b] uppercase font-semibold">Destino</p>
                      <p className="text-sm font-semibold text-[#1e293b]">{destino}</p>
                    </div>
                  </div>
                )}
                {regresoA && (
                  <>
                    <ArrowRight className="h-5 w-5 text-[#cbd5e1] flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-10 w-10 rounded-full bg-[#fef3c7] flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-[#d97706]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748b] uppercase font-semibold">Regreso a</p>
                        <p className="text-sm font-semibold text-[#1e293b]">{regresoA}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Service Description Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-[#cbd5e1]">
            <thead>
              <tr className="bg-[#e2e8f0]">
                <th className="border border-[#cbd5e1] px-3 py-2 text-left text-xs font-bold uppercase">
                  Descripción del Servicio
                </th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-center text-xs font-bold uppercase w-24">
                  Cantidad
                </th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-right text-xs font-bold uppercase w-32">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#cbd5e1] px-3 py-2 text-sm">
                  {descripcion || "Servicio de transporte"}
                </td>
                <td className="border border-[#cbd5e1] px-3 py-2 text-center text-sm">1</td>
                <td className="border border-[#cbd5e1] px-3 py-2 text-right text-sm font-semibold">
                  {formatCurrency(finalTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-80">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-[#475569]">Cantidad de pasajeros:</span>
                <span className="font-semibold">{passengers || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#e2e8f0]">
                <span className="text-[#475569]">SUB.TOTAL:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#475569]">IVA (10.5%):</span>
                <span className="font-semibold">{formatCurrency(ivaAmount)}</span>
              </div>
              <div className="flex justify-between py-3 bg-[#d1fae5] px-3 rounded-md border-2 border-[#059669]">
                <span className="font-bold text-[#1e293b]">TOTAL (Iva incl):</span>
                <span className="font-bold text-[#065f46] text-lg">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-2 bg-[#ecfdf5] p-4 rounded-lg mb-3">
          <p className="text-center text-sm font-semibold text-[#065f46]">
            La cotización tiene una validez de 15 días.
          </p>
          <p className="text-center text-sm font-semibold text-[#065f46]">
            Tarifas y disponibilidad sujetas a confirmación
          </p>
        </div>

        <div className="border-t-2 border-[#e2e8f0] pt-3 space-y-2 text-xs text-[#475569] italic uppercase">
          <p>
            <strong>IMPORTANTE:</strong> LOS VIAJES DEBERÁN SER ABONADOS CON UN MÍNIMO DE 72 hs ANTES DE LA FECHA DE LOS MISMOS.
          </p>
          <p>
            LA FORMA DE PAGO ES MEDIANTE DEPÓSITO BANCARIO, EL CUAL SE DEBERÁ ENVIAR COMPROBANTE DE PAGO POR CORREO ELECTRÓNICO Y/O WHATSAPP AL NÚMERO 351-6617222
          </p>
        </div>
      </div>
    </div>
  );
});

PdfExportTemplate.displayName = 'PdfExportTemplate';

export default PdfExportTemplate;
