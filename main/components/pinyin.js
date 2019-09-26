import Dict from './pinyin-dict';

let letters = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
  e: 'E',
  f: 'F',
  g: 'G',
  h: 'H',
  i: 'I',
  j: 'J',
  k: 'K',
  l: 'L',
  m: 'M',
  n: 'N',
  o: 'O',
  p: 'P',
  q: 'Q',
  r: 'R',
  s: 'S',
  t: 'T',
  u: 'U',
  v: 'V',
  w: 'W',
  x: 'X',
  y: 'Y',
  z: 'Z'
}

const Pinyin = {
  getInitial(s) {
    let keys = Object.keys(Dict);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let val = Dict[key];
      if (val.indexOf(s[0]) >= 0)
        return letters[key[0]];
    }
  }
}

export default Pinyin;
