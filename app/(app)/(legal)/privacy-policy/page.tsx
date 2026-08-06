import ReactMarkdown from "react-markdown";
import {retrieveLatestPolicy} from "@/routers/compliance";
import {BackButton} from "@/components/buttons/back-button";

export default async function PrivacyPolicy() {
    const policy = await retrieveLatestPolicy();

    if (!policy) {
        return (
            <main className="container mx-auto max-w-4xl px-4 py-12">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-gray-500">Nessuna informativa sulla privacy trovata nel sistema.</p>
            </main>
        );
    }

    return (
        <>
            <BackButton className="mt-6 ml-6" />
            <main className="container mx-auto max-w-4xl px-4 py-12">
                <div className="mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                        <span>Versione {policy.version}</span>
                        <span>
                        Ultimo aggiornamento: {new Date(policy.publishedAt).toLocaleDateString('it-IT')}
                    </span>
                    </div>
                </div>

                <div className="prose prose-blue dark:prose-invert max-w-none">
                    <ReactMarkdown>
                        {policy.content}
                    </ReactMarkdown>
                </div>
            </main>
        </>
    );
}