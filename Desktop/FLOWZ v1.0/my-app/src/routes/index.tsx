import * as fs from 'node:fs'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Button } from '../components/ui/button'
import { LandingPage } from '../components/LandingPage'

const filePath = 'count.txt'

async function readCount() {
    return parseInt(
        await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
    )
}

const getCount = createServerFn({
    method: 'GET',
}).handler(() => {
    return readCount()
})

const updateCount = createServerFn({ method: 'POST' })
    .handler(async () => {
        const count = await readCount()
        await fs.promises.writeFile(filePath, `${count + 1}`)
    })

export const Route = createFileRoute('/')({
    component: LandingPage,
    loader: async () => await getCount(),
})

function Home() {
    const router = useRouter()
    const state = Route.useLoaderData()

    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <Link className="flex items-center justify-center" to="/">
                    <span className="font-bold text-xl">FLOWZ</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" to="/">
                        Features
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" to="/login" as={undefined as any}>
                        Login
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" to="/app/overview" as={undefined as any}>
                        Dashboard
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                    Welcome to FLOWZ v1.0
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                    The ultimate platform for your workflow needs. Fast, reliable, and beautiful.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Link to="/login" as={undefined as any}>
                                    <Button>Get Started</Button>
                                </Link>
                                <Button variant="outline">Learn More</Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
