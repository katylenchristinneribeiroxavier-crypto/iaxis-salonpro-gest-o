import { describe, expect, it } from 'vitest';
import { semaforo, usosRestantes, resumoEstoque, pedidoWhatsApp, estoqueBaixo } from './estoque';

describe('estoque', () => {
  it('semáforo verde acima, amarelo igual, vermelho abaixo da mínima', () => {
    expect(semaforo(500, 200)).toBe('verde');
    expect(semaforo(200, 200)).toBe('amarelo');
    expect(semaforo(100, 200)).toBe('vermelho');
  });
  it('400ml com consumo 200 = 2 usos', () => {
    expect(usosRestantes(400, 200)).toBe(2);
    expect(usosRestantes(400, 0)).toBeNull();
    expect(resumoEstoque({ quantidade_atual: 400, unidade: 'ml', consumo_por_servico: 200, servico_relacionado: 'Progressiva' })).toBe('Restam 400ml = 2 progressivas');
  });
  it('alerta quando atual <= mínima', () => {
    expect(estoqueBaixo(200, 200)).toBe(true);
    expect(estoqueBaixo(201, 200)).toBe(false);
  });
  it('link do pedido usa wa.me com o número do fornecedor', () => {
    expect(pedidoWhatsApp('+55 (11) 99999-0000', 'Ana', 'Progressiva X')).toMatch(/^https:\/\/wa\.me\/5511999990000\?text=Ol%C3%A1%20Ana%2C%20preciso%20repor%20Progressiva%20X/);
  });
});

import { extrairQuantidade, numeroAproximado } from './estoque';
describe('foto do produto', () => {
  it('lê 1000ml, 1L, 500g e 1kg', () => {
    expect(extrairQuantidade('Shampoo 1000ml')).toEqual({ quantidade: 1000, unidade: 'ml' });
    expect(extrairQuantidade('Conteúdo 1L')).toEqual({ quantidade: 1000, unidade: 'ml' });
    expect(extrairQuantidade('Peso 500g')).toEqual({ quantidade: 500, unidade: 'g' });
    expect(extrairQuantidade('1kg')).toEqual({ quantidade: 1000, unidade: 'g' });
    expect(extrairQuantidade('sem medida')).toBeNull();
  });
  it('aceita consumo aproximado', () => {
    expect(numeroAproximado('mais ou menos 200ml')).toBe(200);
  });
});
