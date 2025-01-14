/**
 * A utility function for performing typed HTTP fetch requests. This function
 * uses generics to ensure the response data is of a specific type, enhancing
 * type safety in TypeScript.
 *
 * @template T - The expected data type of the response.
 * @param url - The URL to fetch.
 * @param options - Optional configuration options for the fetch request, such as method, headers, etc.
 * @returns A promise that resolves to the response data of type T if the request is successful.
 * @throws An error if the fetch request fails (e.g., response is not ok).
 */
export async function typedFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  // Perform the fetch request with the given URL and options
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  // Parse the response JSON and assert its type to T
  const data = (await response.json()) as T;
  return data;
}
