# Testing Policy

## Test naming

Write test names in the format: `"when [condition], it should [expected result]"`

```ts
it('when isbn is valid, it should return book info', async () => { ... });
it('when camera is denied, it should show manual input fallback', async () => { ... });
```

## Test structure

Add a one-line comment at the top of each test explaining what is being verified.
Separate sections with comments:

```ts
it('when due date is within 3 days, it should mark book as urgent', () => {
  // Verifies that daysLeft <= 3 triggers the urgent flag on BookCard

  // Arrange
  const book = { ...mockBook, dueDate: addDays(today(), 2) };

  // Act
  render(<BookCard book={book} onReturn={vi.fn()} onEdit={vi.fn()} />);

  // Assert
  expect(screen.getByRole('article')).toHaveClass('urgent');
});
```

## Mock policy

- **Use mocks only at the boundary of external dependencies**: HTTP requests, the barcode reader (`@zxing/browser`, which needs a real camera), and datetime (`Date.now`, `new Date()`). `localStorage` is not mocked — jsdom provides a real one; clear it in `beforeEach`.
- **Do not mock functions within the same file or module.** If you need to mock an internal helper, extract it to a separate module first.
- **When using a mock, add a one-line comment explaining why** that dependency is mocked.
- **If more than 3 mocks are needed**, consider refactoring the design of the subject under test — it likely has too many responsibilities.

Stub `fetch` when testing a service directly; mock the service module when testing a
component that merely consumes it.

```ts
// Mock fetch because Google Books API is an external HTTP dependency
vi.stubGlobal('fetch', vi.fn());

// Mock the NDL service because it is the HTTP boundary of this component
vi.mock('../services/ndlSearch', () => ({ searchMagazineIssues: vi.fn() }));
```

## Tools

| Purpose           | Library                     |
| ----------------- | --------------------------- |
| Test runner       | Vitest                      |
| Component testing | @testing-library/react      |
| User interactions | @testing-library/user-event |
| DOM matchers      | @testing-library/jest-dom   |
| HTTP mocking      | `vi.stubGlobal` / `vi.mock` |
