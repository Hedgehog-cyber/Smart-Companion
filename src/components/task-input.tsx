"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, Mic, MicOff } from "lucide-react";
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

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Silently disable if not supported, button will be disabled.
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      toast({
        variant: "destructive",
        title: "Speech Recognition Error",
        description: event.error === 'not-allowed' ? 'Microphone access was denied.' : `An error occurred: ${event.error}`,
      });
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      form.setValue('task', transcript);
    };
    
    recognitionRef.current = recognition;

  }, [form, toast]);


  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    
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
            description: "Please try again.",
        })
      }
    }
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">What's on your mind?</CardTitle>
        <CardDescription>
          Tell me what's feeling overwhelming. We'll break it down together.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">What task is overwhelming you right now?</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="e.g., 'Clean the entire house' or click the mic to speak"
                        className="min-h-[120px] text-base resize-none pr-12"
                        {...field}
                      />
                       <Button 
                         type="button"
                         size="icon"
                         variant="ghost"
                         onClick={handleMicClick}
                         disabled={!recognitionRef.current}
                         className={cn(
                           "absolute top-3 right-3 text-muted-foreground hover:text-foreground",
                           isListening && "text-primary animate-pulse"
                         )}
                       >
                         {isListening ? <MicOff /> : <Mic />}
                         <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                       </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full" size="lg">
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Wand2 />
              )}
              <span>{isPending ? "Generating steps..." : "Break It Down"}</span>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
