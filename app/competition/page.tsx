import { redirect } from 'next/navigation';

interface CompetitionPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CompetitionPage({ searchParams }: CompetitionPageProps) {
  const params = await searchParams;
  
  // Build the redirect path with query parameters
  const searchParamsObj = new URLSearchParams();
  
  // Preserve query parameters if any
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParamsObj.append(key, v));
      } else {
        searchParamsObj.set(key, value);
      }
    }
  });
  
  // Build the target path
  const queryString = searchParamsObj.toString();
  const targetPath = '/events/archalley-competition-2025' + (queryString ? `?${queryString}` : '');
  
  redirect(targetPath);
}

