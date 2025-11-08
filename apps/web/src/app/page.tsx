export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Kontecst</h1>
          <p className="text-xl mb-8 text-muted-foreground">
            Platform for versioned, queryable context for agents
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Kontecst Packages</h3>
              <p className="text-sm text-muted-foreground">
                Collections of .md files with metadata, versioned and curated
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Vector Store</h3>
              <p className="text-sm text-muted-foreground">
                Managed PostgreSQL with pgvector for semantic search
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">API Access</h3>
              <p className="text-sm text-muted-foreground">
                REST/GraphQL endpoints with access control and logging
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
