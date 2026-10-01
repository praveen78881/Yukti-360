"use strict";
/* ---- ITR-2 signing (utility v1.4, AY 2026-27) — verified against GenerateJson.bas.
   Same HMAC as ITR-1: key HZX4oKH11zARYIb2, 1988 iterations, same algorithm.
   Only SWVersionNo (R5) and the envelope (ITR2) differ. The Digest is an
   HMAC-SHA256 of the compact JSON with Digest "-", re-hashed 1988×, base64. */
const HASH_KEY="HZX4oKH11zARYIb2";
const HASH_ITER=1988;
const SW_VERSION="R5";                // getSWVersionNo() ITR-2
const SW_CREATED="SW90002627";        // getSWCreatedBy() / getJSONCreatedBy() ITR-2
async function computeDigest(compactJson){
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",enc.encode(HASH_KEY),
    {name:"HMAC",hash:"SHA-256"},false,["sign"]);
  let bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(compactJson)));
  for(let i=0;i<HASH_ITER;i++)
    bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,bytes));
  let bin="";for(const b of bytes)bin+=String.fromCharCode(b);
  return btoa(bin);
}