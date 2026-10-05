export class ApiError extends Error {constructor(message:string,public status=0){super(message);}}
export async function requestData(base:string,path:string,options:RequestInit={}) : Promise<unknown> {
 const response=await fetch(base+path,options);
 if(response.status===401)throw new ApiError('Tu sesión expiró. Vuelve a iniciar sesión.',401);
 if(response.status===403)throw new ApiError('No tienes permiso para esta operación.',403);
 if(response.status===409)throw new ApiError('El registro cambió o ya existe. Actualiza antes de reintentar.',409);
 if(!response.ok)throw new ApiError(response.status===400?'Revisa los datos ingresados.':'No se pudo confirmar la operación. Actualiza antes de reintentar.',response.status);
 const result=await response.json();if(!result||!('data' in result))throw new ApiError('No se pudo confirmar la respuesta.');return result.data;
}
