import { useId } from 'react';
import { Checkbox } from './ui/checkbox';

export function TermosELGPD({ checked, onChange, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return <div className="flex items-start gap-3 py-3"><Checkbox id={id} checked={checked} onCheckedChange={value => onChange(value === true)} disabled={disabled} /><label htmlFor={id} className="cursor-pointer text-sm leading-relaxed">Eu concordo com Termos de Uso, LGPD e Contrato de Licença Nacional.</label></div>;
}