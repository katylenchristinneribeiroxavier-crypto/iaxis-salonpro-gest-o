export function accessOpen(salon:{access_enabled:boolean;suspended_until:string|null;archived_at:string|null},now=Date.now()){
 return !salon.archived_at && (salon.access_enabled || !!(salon.suspended_until && new Date(salon.suspended_until).getTime()<=now));
}