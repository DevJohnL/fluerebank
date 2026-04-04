/** Scroll suave até à secção de vantagens (destino do CTA "Ver como funciona"). */
export function scrollParaSecaoVantagens() {
  document.getElementById('vantagens')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
