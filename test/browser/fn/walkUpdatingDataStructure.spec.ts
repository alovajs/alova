import { walkUpatingDataStructure } from '../../../src/utils/helper';

describe('walkUpatingDataStructure', function () {
	test('basic data', () => {
		const { f: f1, c: c1 } = walkUpatingDataStructure(1);
		expect(f1).toBe(1);
		expect(c1.length).toBe(0);

		const { f: f2, c: c2 } = walkUpatingDataStructure('xxxx');
		expect(f2).toBe('xxxx');
		expect(c2.length).toBe(0);

		const { f: f3, c: c3 } = walkUpatingDataStructure(true);
		expect(f3).toBeTruthy();
		expect(c3.length).toBe(0);
	});

	test('plain object', () => {
		const { f: f1, c: c1 } = walkUpatingDataStructure({ action: 'responsed', value: (v: any) => v.id });
		expect(f1).toBeUndefined();
		expect(c1.length).toBe(1);

		const { f: f2, c: c2 } = walkUpatingDataStructure({ action: 'responsed', value: (v: any) => v.id, default: 1 });
		expect(f2).toBe(1);
		expect(c2.length).toBe(1);

		const obj = {
			a: 1,
			b: [(v: any) => v.dd, 'a'],
			c: { action: 'responsed', value: (v: any) => v.id, default: 12 },
			'+d': (v: any) => v.id2,
			'+e': [(v: any) => v.dd, 'a'],
			f: (v: any) => v.id2,
			'+g': [1, 2]
		};
		const { f: f3, c: c3 } = walkUpatingDataStructure(obj);
		expect(f3).toEqual({ a: 1, b: obj.b, c: 12, d: undefined, e: 'a', f: obj.f, '+g': [1, 2] });
		expect(c3.length).toBe(3);
	});

	test('not plain object', () => {
		const reg: any = /123/;
		reg['+a'] = [(v: any) => v.a, 123];
		const { f: f1, c: c1 } = walkUpatingDataStructure(reg);
		expect(f1).toBe(reg);
		expect(c1.length).toBe(0);
	});

	test('array', () => {
		const { f: f3, c: c3 } = walkUpatingDataStructure([
			1,
			{ action: 'responsed', value: (v: any) => v.id, default: 12 },
			(v: any) => v.id2,
			[(v: any) => v.dd, 'a'],
			4
		]);
		expect(f3[0]).toBe(1);
		expect(f3[1]).toBe(12);
		expect(typeof f3[2]).toBe('function');
		expect(Array.isArray(f3[3])).toBeTruthy();
		expect(f3[4]).toBe(4);
		expect(c3.length).toBe(1);
	});

	test('object + array', () => {
		const combinedAry = [
			1,
			{ action: 'responsed', value: (v: any) => v.id, default: 12 },
			(v: any) => v.id2,
			[(v: any) => v.dd, 'a'],
			4,
			{
				a: 1,
				b: 2,
				'+c': (v: any) => v.c,
				d: { action: 'responsed', value: (v: any) => v.id, default: 24 },
				e: [{ action: 'responsed', value: (v: any) => v.id, default: 36 }, [(v: any) => v.dd, 'aaa'], 3, 6]
			}
		];
		const { f: f3, c: c3 } = walkUpatingDataStructure(combinedAry);
		expect(f3[1]).toBe(12);
		expect(f3[5].c).toBeUndefined();
		expect(f3[5].d).toBe(24);
		expect(f3[5].e[0]).toBe(36);
		expect(c3.length).toBe(4);

		expect(c3[0].p).toEqual([1]);
		expect(c3[1].p).toEqual([5, 'c']);
		expect(c3[2].p).toEqual([5, 'd']);
		expect(c3[3].p).toEqual([5, 'e', 0]);

		const combinedObj = {
			a: 1,
			b: { action: 'responsed', value: (v: any) => v.id, default: 12 },
			'+c': (v: any) => v.id2,
			d: [(v: any) => v.dd, 'a'],
			e: [
				{ action: 'responsed', value: (v: any) => v.id, default: 36 },
				[(v: any) => v.dd, 'aaa'],
				3,
				6,
				{
					'+g': 2,
					h: { action: 'responsed', value: (v: any) => v.id, default: 24 }
				}
			]
		};
		const { f: f4, c: c4 } = walkUpatingDataStructure(combinedObj);
		expect(f4.b).toBe(12);
		expect(f4.c).toBeUndefined();
		expect(f4.e[0]).toBe(36);
		expect(f4.e[4].h).toBe(24);
		expect(c4.length).toBe(4);

		expect(c4[0].p).toEqual(['b']);
		expect(c4[1].p).toEqual(['c']);
		expect(c4[2].p).toEqual(['e', 0]);
		expect(c4[3].p).toEqual(['e', 4, 'h']);
	});

	test('circular reference', () => {
		const o1: any = { a: 1, b: 3 };
		const o2: any = { c: 3, d: 4 };
		o1.o2 = o2;
		o2.o1 = o1;

		expect(() => {
			walkUpatingDataStructure(o1);
		}).toThrowError();
	});
});
