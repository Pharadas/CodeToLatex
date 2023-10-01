import { pythonToJson } from  '../main';

test('test division', () => {
  expect(pythonToJson("4/3")).toBe("\\frac{4}{3}");
});