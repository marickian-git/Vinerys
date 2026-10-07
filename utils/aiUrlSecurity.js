import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost', 'localhost.localdomain', 'metadata.google.internal',
  'metadata.google.com', 'instance-data.ec2.internal',
]);

function isPrivateIpv4(address) {
  const octets = address.split('.').map(Number);
  return octets[0] === 10 || octets[0] === 127 || octets[0] === 0 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127); // CGNAT
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase();
  // IPv4 mapat în IPv6 (::ffff:127.0.0.1) ocolește altfel verificarea IPv4
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  // WHATWG URL normalizează ::ffff:127.0.0.1 la forma hex ::ffff:7f00:1
  const mappedHex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const [high, low] = mappedHex.slice(1).map((part) => Number.parseInt(part, 16));
    return isPrivateIpv4([high >> 8, high & 255, low >> 8, low & 255].join('.'));
  }
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb');
}

function isPrivateAddress(address) {
  return net.isIPv4(address) ? isPrivateIpv4(address) : net.isIPv6(address) && isPrivateIpv6(address);
}

export async function validateProviderBaseUrl(value, { resolve = true } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Endpointul providerului nu este un URL valid');
  }
  if (url.protocol !== 'https:') throw new Error('Endpointurile custom trebuie să folosească HTTPS');
  if (url.username || url.password) throw new Error('URL-ul nu poate conține credentiale');
  if (url.port && url.port !== '443') throw new Error('Portul endpointului nu este permis');
  if (BLOCKED_HOSTNAMES.has(url.hostname.toLowerCase())) throw new Error('Hostname-ul endpointului nu este permis');

  // IPv6 apare în URL între paranteze drepte: [::1]
  const host = url.hostname.replace(/^\[(.*)\]$/, '$1');
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new Error('Adresele private sau locale nu sunt permise');
  } else if (resolve) {
    const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      throw new Error('Hostname-ul endpointului indică o adresă privată sau locală');
    }
  }
  return url.origin + url.pathname.replace(/\/$/, '');
}