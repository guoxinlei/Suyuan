/**
 * set message into state
 */
export function setMessage(params) {
  let obj = Object.assign({type:'setMessage'}, params);
  return obj;
}
