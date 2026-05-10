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

- **Use mocks only at the boundary of external dependencies**: HTTP requests, Firestore, localStorage, file system, and datetime (`Date.now`, `new Date()`).
- **Do not mock functions within the same file or module.** If you need to mock an internal helper, extract it to a separate module first.
- **When using a mock, add a one-line comment explaining why** that dependency is mocked.
- **If more than 3 mocks are needed**, consider refactoring the design of the subject under test — it likely has too many responsibilities.

```ts
// Mock fetch because Google Books API is an external HTTP dependency
vi.stubGlobal('fetch', vi.fn());

// Mock Firestore because tests must not write to a real database
vi.mock('../services/firebase');
```

## Tools

| Purpose           | Library                     |
| ----------------- | --------------------------- |
| Test runner       | Vitest                      |
| Component testing | @testing-library/react      |
| User interactions | @testing-library/user-event |
| DOM matchers      | @testing-library/jest-dom   |
| HTTP mocking      | msw (Mock Service Worker)   |
