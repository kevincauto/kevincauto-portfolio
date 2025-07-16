import { NextResponse } from 'next/server';

export async function GET() {
  const GITHUB_USERNAME = 'kevincauto';
  const GITHUB_API_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_API_TOKEN) {
    return NextResponse.json({ error: 'GitHub token is not configured' }, { status: 500 });
  }

  const query = `
    query($userName:String!) {
      user(login: $userName){
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                weekday
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${GITHUB_API_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          userName: GITHUB_USERNAME,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API Error:', errorData);
      return NextResponse.json({ error: `GitHub API responded with status: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    if(data.errors) {
      console.error('GitHub GraphQL Errors:', data.errors);
      return NextResponse.json({ error: 'Error in GitHub GraphQL query', details: data.errors }, { status: 400 });
    }
    
    return NextResponse.json(data.data.user.contributionsCollection.contributionCalendar);
  } catch (error) {
    console.error('Failed to fetch GitHub contributions:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub contributions' }, { status: 500 });
  }
} 