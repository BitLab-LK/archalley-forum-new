import { redirect } from 'next/navigation';

export default async function CompetitionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Build redirect URL with query parameters
  let targetUrl = '/events/archalley-competition-2025';
  
  // Preserve query parameters if any
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, String(v)));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      targetUrl += `?${queryString}`;
    }
  }
  
  redirect(targetUrl);
}

