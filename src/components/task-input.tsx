"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


// Extend window type for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const formSchema = z.object({
  task: z.string().min(10, {
    message: "Please describe your task in a bit more detail (at least 10 characters).",
  }),
});

type TaskInputProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isPending: boolean;
};

export function TaskInput({ onSubmit, isPending }: TaskInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      task: "",
    },
  });
  
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return; // Silently fail if not supported
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log('Listening...');
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error", event);
      if (event.error === 'not-allowed') {
        toast({
          variant: 'destructive',
          title: 'Microphone blocked',
          description: 'Please allow access in your browser bar.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Speech Recognition Error',
          description: `An error occurred: ${event.error}`,
        });
      }
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      form.setValue('task', transcript, { shouldValidate: true });
      // Automatically submit the form
      setTimeout(() => {
        if (formRef.current) {
            // A native submit is needed to trigger the form's onSubmit
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    };

    recognitionRef.current = recognition;

    // Cleanup function to stop recognition if the component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [form, toast]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Not Supported',
        description: 'Your browser does not support this feature.',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Speech recognition start error:", error)
        toast({
            variant: "destructive",
            title: "Could not start listening",
            description: "There was an issue starting the speech recognition service.",
        })
      }
    }
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">What's on your mind?</CardTitle>
        <CardDescription>
          Tell me what's feeling overwhelming. We'll break it down together.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">What task is overwhelming you right now?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Clean the entire house' or use the mic to speak"
                      className="min-h-[120px] text-base resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex justify-center items-center gap-4">
              <Button type="submit" disabled={isPending} className="flex-grow" size="lg">
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Wand2 />
                )}
                <span>{isPending ? "Generating steps..." : "Break It Down"}</span>
              </Button>
              <Button 
                type="button"
                size="lg"
                variant="outline"
                onClick={handleMicClick}
                disabled={isPending}
                className={cn(
                  'transition-colors',
                  isListening && "bg-destructive/20 text-destructive border-destructive/50"
                )}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                 <Mic className="h-5 w-5" />
                 <span>{isListening ? 'Listening...' : 'Speak'}</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
