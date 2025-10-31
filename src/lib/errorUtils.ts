/**
 * Maps technical database errors to user-friendly messages
 * Prevents exposure of internal schema information
 */
export function getErrorMessage(error: any): string {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Unique constraint violations
  if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
    if (errorMessage.includes('cpf')) return 'Este CPF já está cadastrado';
    if (errorMessage.includes('cnpj')) return 'Este CNPJ já está cadastrado';
    if (errorMessage.includes('email')) return 'Este e-mail já está cadastrado';
    if (errorMessage.includes('codigo_barras')) return 'Este código de barras já está cadastrado';
    if (errorMessage.includes('sku')) return 'Este SKU já está cadastrado';
    return 'Este registro já existe no sistema';
  }
  
  // Foreign key violations
  if (errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
    return 'Não é possível completar a operação devido a registros relacionados';
  }
  
  // RLS policy violations
  if (errorMessage.includes('policy') || errorMessage.includes('permission')) {
    return 'Você não tem permissão para realizar esta operação';
  }
  
  // Validation errors
  if (errorMessage.includes('null value') || errorMessage.includes('not-null')) {
    return 'Todos os campos obrigatórios devem ser preenchidos';
  }
  
  // Network/connection errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente';
  }
  
  // Default generic error
  return 'Não foi possível completar a operação. Tente novamente';
}
