'use client';

import { useEffect, useState } from 'react';
import type { Task } from '@/lib/types';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY_TASKS = "smart_companion_tasks";

export default function HistoryPage() {
    const [history, setHistory] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
            if (savedDataJson) {
                const savedData = JSON.parse(savedDataJson);
                if (savedData.history) {
                    setHistory(savedData.history.sort((a: Task, b: Task) => b.createdAt - a.createdAt)); // Show newest first
                }
            }
        } catch (error) {
            console.error("Failed to load history from localStorage:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDeleteTask = (taskId: string) => {
        try {
            const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
            if (!savedDataJson) return;
    
            const savedData = JSON.parse(savedDataJson);
            const updatedHistory = savedData.history.filter((task: Task) => task.id !== taskId);
    
            const newData = { ...savedData, history: updatedHistory };
            localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(newData));
    
            setHistory(updatedHistory.sort((a: Task, b: Task) => b.createdAt - a.createdAt));
    
            toast({
                title: "Task Deleted",
                description: "The task has been removed from your history.",
            });
        } catch (error) {
            console.error("Failed to delete task from localStorage:", error);
            toast({
                variant: "destructive",
                title: "Error Deleting Task",
                description: "Could not delete the task.",
            });
        }
    };

    return (
        <main className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 pt-12 md:pt-20">
            <AppHeader />
            <div className="w-full max-w-2xl mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold font-headline">Task History</h2>
                    <Button asChild variant="outline">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Current Task
                        </Link>
                    </Button>
                </div>

                {isLoading && <p>Loading history...</p>}
                {!isLoading && history.length === 0 && (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-muted-foreground text-center">You have no completed tasks yet.</p>
                        </CardContent>
                    </Card>
                )}
                {!isLoading && history.length > 0 && (
                    <div className="space-y-4">
                        {history.map(task => (
                            <Card key={task.id}>
                                <CardHeader>
                                    <CardTitle>{task.mainTask}</CardTitle>
                                    <CardDescription>
                                        Completed on {new Date(task.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="steps">
                                            <AccordionTrigger>View {task.steps.length} steps</AccordionTrigger>
                                            <AccordionContent>
                                                <ul className="space-y-2 list-disc pl-5">
                                                    {task.steps.map(step => (
                                                        <li key={step.id}>
                                                            {step.text}
                                                            {step.subSteps && step.subSteps.length > 0 && (
                                                                <ul className="list-[circle] pl-5">
                                                                    {step.subSteps.map(subStep => (
                                                                        <li key={subStep.id}>{subStep.text}</li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                                <CardFooter className="justify-end">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this task
                                                    from your history.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
