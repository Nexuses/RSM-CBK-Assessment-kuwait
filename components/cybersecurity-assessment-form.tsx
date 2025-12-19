"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Mail,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import ReactSpeedometer, {
} from "react-d3-speedometer";
import styles from "@/styles/CybersecurityAssessmentForm.module.css";
import { questionsData, Question } from '@/lib/questions';

// Add this near the top of the file, before the component
const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
];


export function CybersecurityAssessmentForm() {
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [hasStartedAssessment, setHasStartedAssessment] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [questions] = useState<Question[]>(questionsData);
  const TOTAL_QUESTIONS = questions.length; // 15 questions
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationSuccess, setConsultationSuccess] = useState(false);
  const [consultationError, setConsultationError] = useState<string | null>(null);

  const formSchema = z.object({
    name: z.string().min(2, { 
      message: "Please enter a valid name." 
    }),
    email: z.string().email("Please enter a valid email address").refine((email) => {
      if (!email.includes("@")) return false;
      const [, domain] = email.split("@");
      return domain && !BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase());
    }, "Please use your business email address."),
    company: z.string().min(2, { 
      message: "Company name cannot be empty." 
    }),
    position: z.string().min(2, { 
      message: "Please enter a valid position." 
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      position: "",
    },
    mode: "onSubmit"
  });

  useEffect(() => {
    if (isConsultationModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isConsultationModalOpen]);

  const consultationSchema = z.object({
    firstName: z.string().min(2, { message: "Please enter a valid first name." }),
    lastName: z.string().min(2, { message: "Please enter a valid last name." }),
    email: z.string().email("Please enter a valid email address."),
    phone: z
      .string()
      .min(7, { message: "Please enter a valid phone number." })
      .max(20, { message: "Phone number is too long." }),
  });

  const consultationForm = useForm<z.infer<typeof consultationSchema>>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const handlePersonalInfoSubmit = (values: z.infer<typeof formSchema>) => {
    setPersonalInfo(values);
    setCurrentQuestion(1); // Move to the first question
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);
    
    // Automatically advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestion < TOTAL_QUESTIONS) {
        setFormErrors([]);
        setCurrentQuestion(currentQuestion + 1);
      } else if (currentQuestion === TOTAL_QUESTIONS) {
        // If this is the last question, calculate score with updated answers
        const totalScore = Object.values(updatedAnswers).reduce(
          (sum, val) => sum + parseInt(val),
          0
        );
        setScore(totalScore);
        setAnimatedScore(0);
        
        // Calculate percentage score (out of 15 questions)
        // Each "Yes" = 1 point, Each "No" = 0 points
        // Percentage = (totalScore / TOTAL_QUESTIONS) * 100
        const percentageScore = Math.round((totalScore / TOTAL_QUESTIONS) * 100);

        // Animate the score
        const animationDuration = 1000;
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(animationDuration / frameDuration);
        let frame = 0;
        const animate = () => {
          const progress = frame / totalFrames;
          setAnimatedScore(Math.floor(progress * percentageScore));
          if (frame < totalFrames) {
            frame++;
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);

        // Send the data to the server
        const assessmentData = {
          personalInfo: {
            name: personalInfo.name,
            email: personalInfo.email,
            company: personalInfo.company,
            position: personalInfo.position,
          },
          answers: updatedAnswers,
          score: totalScore,
        };

        fetch("/api/send-assessment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assessmentData),
        }).catch((error) => {
          console.error("Error sending assessment results:", error);
        });
      }
    }, 300); // Small delay to allow UI to update
  };

  const handleNext = () => {
    if (currentQuestion === 0) {
      form.handleSubmit(handlePersonalInfoSubmit)();
    } else if (currentQuestion < TOTAL_QUESTIONS) {
      if (!answers[questions[currentQuestion - 1].id]) {
        setFormErrors(["Please select an answer before proceeding."]);
        return;
      }
      setFormErrors([]);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = async () => {
    const totalScore = Object.values(answers).reduce(
      (sum, value) => sum + parseInt(value),
      0
    );
    setScore(totalScore);
    setAnimatedScore(0); // Reset animated score
    
    // Calculate percentage score (out of 15 questions)
    // Each "Yes" = 1 point, Each "No" = 0 points
    // Percentage = (totalScore / TOTAL_QUESTIONS) * 100
    const percentageScore = Math.round((totalScore / TOTAL_QUESTIONS) * 100);

    // Animate the score
    const animationDuration = 1000; // 1 second
    const frameDuration = 1000 / 60; // 60 fps
    const totalFrames = Math.round(animationDuration / frameDuration);
    let frame = 0;
    const animate = () => {
      const progress = frame / totalFrames;
      setAnimatedScore(Math.floor(progress * percentageScore));
      if (frame < totalFrames) {
        frame++;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    // Prepare the data to be sent via API
    const assessmentData = {
      personalInfo: {
        name: personalInfo.name,
        email: personalInfo.email,
        company: personalInfo.company,
        position: personalInfo.position,
      },
      answers,
      score: totalScore,
    };

    // Send the data to the server
    try {
      const response = await fetch("/api/send-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to send assessment results"
        );
      }

      const data = await response.json();
      console.log("Assessment results sent successfully:", data);
    } catch (error) {
      console.error("Error sending assessment results:", error);
    }
  };

  const progress = ((currentQuestion + 1) / (TOTAL_QUESTIONS + 1)) * 100;

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // const getScoreColor = (score: number) => {
  //   if (score >= 85) return "text-green-500";
  //   if (score >= 65) return "text-yellow-500";
  //   if (score >= 35) return "text-orange-500";
  //   return "text-red-500";
  // };


  const handleConsultationSubmit = async (values: z.infer<typeof consultationSchema>) => {
    setConsultationError(null);
    setIsSubmittingConsultation(true);
    try {
      const response = await fetch("/api/book-consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          context: {
            personalInfo,
            score: score ?? animatedScore,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit consultation request.");
      }

      consultationForm.reset();
      setConsultationSuccess(true);
      setIsConsultationModalOpen(false);
    } catch (error) {
      console.error("Error submitting consultation form:", error);
      setConsultationError(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmittingConsultation(false);
    }
  };



  if (currentQuestion === 0) {
    return (
      <div className="min-h-screen">
        <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
          <Image
            src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM%20Kuwait%20ESG/Frame%204%20(1).png"
            alt="Cybersecurity Assessment Tool Banner"
            width={1920}
            height={540}
            className="block w-full h-auto"
            priority
          />
        </section>
        <section className="relative pb-16">
          <div className="relative mx-auto mt-12 max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
            {!hasStartedAssessment ? (
              <Card className="rounded-3xl border-2 border-[#3F9C35] bg-white shadow-[0_25px_70px_rgba(2,48,89,0.12)]">
                  <CardHeader className="space-y-2 text-center relative px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#1b3a57]">
                      Assessment Guidance
                    </CardTitle>
                  </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Instructions Section */}
                    <div className="border-b border-gray-200 pb-4 sm:pb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-[#1b3a57] mb-3 sm:mb-4">Instructions</h3>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4 sm:mb-6">
                        This assessment consists of Yes/No questions. Each question has two answer options:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-white rounded-lg border-l-4 border-[#3F9C35] border border-[#63666a] shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg bg-[#3F9C35]/10 flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-xl md:text-2xl font-bold text-[#3F9C35] block">1</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wide">pt</span>
                            </div>
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                              <strong className="text-[#1b3a57] font-semibold">Yes</strong> = 1 point
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-white rounded-lg border-l-4 border-[#ef4444] border border-[#63666a] shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-xl md:text-2xl font-bold text-[#ef4444] block">0</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wide">pts</span>
                            </div>
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                              <strong className="text-[#1b3a57] font-semibold">No</strong> = 0 points
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 bg-[#00AEEF]/5 rounded-lg border border-[#00AEEF]/20">
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                          Scoring: Your total score will be calculated by summing the points from all your answers. Each &apos;Yes&apos; answer earns 1 point, and each &apos;No&apos; answer earns 0 points. The assessment will provide you with a cybersecurity maturity level based on your total score.
                        </p>
                      </div>
                    </div>
                    {/* Disclaimer Section */}
                    <div className="pt-2 sm:pt-3">
                      <h3 className="text-base sm:text-lg font-semibold text-[#1b3a57] mb-3 sm:mb-4">Disclaimer</h3>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        This assessment does not guarantee the detection of all existing or potential vulnerabilities, threats, or exploits. It reflects the organization&apos;s security posture at the time of testing solely based on your responses to the assessment questions. The assessment report is intended solely for your internal use and must not be distributed, disclosed, or relied upon by third parties. RSM shall not be liable for any losses, damages, claims, or expenses arising from, or in connection with, the use of the assessment results.
                      </p>
                    </div>
                    <Button
                      onClick={() => setHasStartedAssessment(true)}
                      className="w-full h-11 sm:h-12 rounded-full bg-[#00AEEF] text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-all hover:bg-[#0091cf] hover:shadow-xl"
                    >
                      Begin Assessment
                    </Button>
                    <p className="text-[10px] sm:text-xs text-gray-600 text-center px-2">
                      By clicking &quot;Begin Assessment&quot;, you agree to our{" "}
                      <a
                        href="https://www.rsm.global/kuwait/privacy-notice"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00AEEF] hover:underline"
                      >
                        privacy policy
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://www.rsm.global/kuwait/securitycybersecurity-positioning-statement"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00AEEF] hover:underline"
                      >
                        terms and conditions
                      </a>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-3xl border-2 border-[#3F9C35] bg-white shadow-[0_25px_70px_rgba(2,48,89,0.12)]">
                  <CardHeader className="space-y-2 text-center relative px-6 pt-6 pb-4">
                    <CardTitle className="text-2xl font-semibold text-[#1b3a57] sm:text-3xl">
                        Personal Information
                      </CardTitle>
                  <CardDescription className="text-base text-gray-500">
                        Please provide your information before starting the assessment
                      </CardDescription>
                    </CardHeader>
              <CardContent className="pt-2">
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(handlePersonalInfoSubmit)}
                          className="space-y-6"
                        >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Name <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                placeholder="Enter your name"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.name &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Business Email <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                type="email"
                                placeholder="your.email@company.com"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.email &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Company <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                placeholder="Enter your company name"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.company &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="position"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Position <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                placeholder="Enter your job title"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.position &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="submit"
                      className="flex h-12 w-full items-center justify-center rounded-full bg-[#00AEEF] text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf]"
                          >
                      Continue to Questions
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
      <div className="min-h-screen">
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
        <Image
          src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM%20Kuwait%20ESG/Frame%204%20(1).png"
          alt="Cybersecurity Assessment Tool Banner"
          width={1920}
          height={540}
          className="block w-full h-auto"
          priority
        />
      </section>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-2 py-10 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {score === null ? (
                <motion.div
                  key={`question-${currentQuestion}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="rounded-3xl border-2 border-[#00AEEF] bg-white/95 backdrop-blur shadow-[0_25px_70px_rgba(3,32,66,0.25)]">
                <CardHeader className="border-b border-gray-100 px-6 py-6 relative">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00AEEF]">
                      Question {currentQuestion} of {TOTAL_QUESTIONS}
                    </span>
                    <CardTitle className="text-xl font-semibold leading-snug text-[#1b3a57] sm:text-2xl">
                      {questions[currentQuestion - 1].text}
                      </CardTitle>
                  </div>
                    </CardHeader>
                <CardContent className="px-6 py-6">
                  <div className="flex gap-4">
                    {questions[currentQuestion - 1].options.map((option) => {
                              const id = `${questions[currentQuestion - 1].id}-${option.value}`;
                      const isSelected =
                        answers[questions[currentQuestion - 1].id] === option.value;
                              return (
                        <div key={option.value} className="flex-1">
                                  <input
                                    type="radio"
                                    id={id}
                                    name={questions[currentQuestion - 1].id}
                                    value={option.value}
                            checked={isSelected}
                                    onChange={() =>
                              handleAnswerChange(questions[currentQuestion - 1].id, option.value)
                                    }
                            className="sr-only"
                                    required
                                  />
                                  <Label
                                    htmlFor={id}
                                    className={cn(
                              "flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm transition-all focus:outline-none cursor-pointer",
                              option.value === "1" && "border border-[#3F9C35]",
                              option.value === "0" && "border border-[#00AEEF]",
                              !isSelected && option.value === "1" && "hover:border-[#3F9C35] hover:shadow-lg",
                              !isSelected && option.value === "0" && "hover:border-[#00AEEF] hover:shadow-lg",
                              isSelected && option.value === "1" &&
                                "border-[#3F9C35] bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[0_12px_30px_rgba(34,197,94,0.22)] hover:shadow-[0_12px_30px_rgba(34,197,94,0.3)]",
                              isSelected && option.value === "0" &&
                                "border-[#00AEEF] bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-[0_12px_30px_rgba(239,68,68,0.22)] hover:shadow-[0_12px_30px_rgba(239,68,68,0.3)]",
                            )}
                          >
                            <span
                                      className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 transition-colors",
                                isSelected && option.value === "1" && "border-white bg-white",
                                isSelected && option.value === "0" && "border-white bg-white",
                                isSelected && option.value !== "1" && option.value !== "0" && "border-[#00AEEF] bg-[#00AEEF]",
                                      )}
                                    >
                                      <Check
                                        className={cn(
                                  "h-3.5 w-3.5 transition-opacity",
                                  isSelected && option.value === "1" && "text-[#22c55e] opacity-100",
                                  isSelected && option.value === "0" && "text-[#ef4444] opacity-100",
                                  isSelected && option.value !== "1" && option.value !== "0" && "text-white opacity-100",
                                  !isSelected && "opacity-0",
                                )}
                              />
                                    </span>
                            <span className={cn(
                              "flex-1 text-left",
                              isSelected && option.value === "1" && "text-white font-semibold",
                              isSelected && option.value === "0" && "text-white font-semibold",
                            )}>{option.label}</span>
                                  </Label>
                                </div>
                              );
                    })}
                        </div>
                        {formErrors.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                          >
                            {formErrors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </motion.div>
                        )}
                    </CardContent>
                <CardFooter className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:justify-between">
                      <Button
                        onClick={handleBack}
                        disabled={currentQuestion === 1}
                    className="h-11 w-full rounded-full border border-gray-200 bg-white text-sm font-semibold text-[#1b3a57] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[200px]"
                      >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        onClick={handleNext}
                    className="h-11 w-full rounded-full bg-[#00AEEF] text-sm font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf] sm:w-[220px]"
                  >
                    {currentQuestion === TOTAL_QUESTIONS ? "Finish" : "Next"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
              initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="rounded-3xl border-0 bg-white/95 backdrop-blur shadow-[0_25px_70px_rgba(3,32,66,0.25)]">
                <CardHeader className="px-6 py-6 text-center">
                  <CardTitle className="text-3xl font-semibold text-[#1b3a57]">
                    Assessment Results
                      </CardTitle>
                    </CardHeader>
                <CardContent className={cn(styles.resultContainer, "px-6 pb-10 pt-2")}>
                      <div className={styles.gaugeContainer}>
                        <ReactSpeedometer
                          value={animatedScore}
                          minValue={0}
                          maxValue={100}
                          segments={4}
                      segmentColors={["#ef4444", "#f97316", "#eab308", "#22c55e"]}
                          currentValueText="${value}%"
                          valueTextFontSize="38px"
                          textColor="#1E293B"
                          paddingHorizontal={30}
                          paddingVertical={30}
                          valueTextFontWeight="600"
                          needleTransitionDuration={4000}
                          needleColor="#1E293B"
                          startColor="#ef4444"
                          endColor="#22c55e"
                          labelFontSize="14px"
                          customSegmentLabels={[
                            {
                              text: "Critical",
                              position: "INSIDE",
                              color: "#1E293B",
                              fontSize: "12px",
                            },
                            {
                              text: "Poor",
                              position: "INSIDE",
                              color: "#1E293B",
                              fontSize: "12px",
                            },
                            {
                              text: "Fair",
                              position: "INSIDE",
                              color: "#1E293B",
                              fontSize: "12px",
                            },
                            {
                              text: "Good",
                              position: "INSIDE",
                              color: "#1E293B",
                              fontSize: "12px",
                            },
                          ]}
                          ringWidth={47}
                          needleHeightRatio={0.7}
                          customSegmentStops={[0, 35, 65, 85, 100]}
                        />
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6 w-full"
                      >
                        <Button
                          type="button"
                          className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-transparent bg-[#00AEEF] px-6 text-sm font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-all hover:bg-[#0091cf] hover:shadow-xl"
                          onClick={() => {
                            setConsultationSuccess(false);
                            setConsultationError(null);
                            setIsConsultationModalOpen(true);
                          }}
                        >
                          <Mail className="h-5 w-5" />
                          <span className="whitespace-nowrap">Book Appointment</span>
                        </Button>
                        <Button
                      className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-transparent bg-[#00AEEF] px-6 text-sm font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-all hover:bg-[#0091cf] hover:shadow-xl"
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/generate-pdf", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                              personalInfo: {
                                name: personalInfo.name,
                                email: personalInfo.email,
                                company: personalInfo.company,
                                position: personalInfo.position,
                              },
                                  score: score || 0,
                                  answers,
                                  questions: questionsData,
                                }),
                              });

                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || "Failed to generate PDF");
                              }

                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `${personalInfo.company}_Cyber_Self_Assessment_Report.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } catch (error: unknown) {
                              console.error("Error generating PDF:", error);
                              if (error instanceof Error) {
                                alert(`An error occurred while generating the PDF: ${error.message}`);
                              } else {
                                alert("An unknown error occurred");
                              }
                            }
                          }}
                        >
                          <svg
                        className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            ></path>
                          </svg>
                          <span className="whitespace-nowrap">Download Report</span>
                        </Button>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="mt-6 rounded-2xl border border-[#3F9C35]/30 bg-gradient-to-r from-[#f0fbf4] to-[#e6f5ed] px-6 py-5 text-center text-[#1b3a57]"
                      >
                        <p className="text-lg font-semibold text-[#1b3a57]">
                          Thank you for completing the assessment! 🎉
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          Your assessment has been completed successfully. You can download your report or book a consultation with our team for further assistance.
                        </p>
                      </motion.div>

                      {!isConsultationModalOpen && consultationSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 rounded-2xl border border-[#3F9C35]/30 bg-gradient-to-r from-[#f0fbf4] to-[#e6f5ed] px-6 py-5 text-center text-[#1b3a57]"
                        >
                          <p className="text-lg font-semibold text-[#1b3a57]">
                            Thank you for reaching out! 🎉
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            Our consulting team has received your request and will get back to you
                            shortly with available consultation slots. A confirmation email is on its
                            way to your inbox.
                          </p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            {score === null && (
              <motion.div
            className="rounded-3xl border-2 border-[#3F9C35] bg-white/80 px-6 py-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
              >
            <div className="relative h-2 overflow-hidden rounded-full bg-[#EAF6FB]">
                  <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-[#009CD9]"
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
              />
                </div>
              </motion.div>
            )}
      </div>
      <AnimatePresence>
        {isConsultationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 px-4 py-8"
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
            >
              <Card className="border border-[#00AEEF]/20 bg-white shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
                <CardHeader className="px-6 pt-6 pb-2 text-center relative">
                  <button
                    onClick={() => {
                      setIsConsultationModalOpen(false);
                      setConsultationError(null);
                    }}
                    className="absolute right-4 top-4 rounded-full border border-gray-200 bg-white p-1 text-gray-500 transition hover:text-gray-800"
                    aria-label="Close consultation form"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl font-semibold text-[#1b3a57]">
                    <UserRound className="h-6 w-6 text-[#00AEEF]" />
                    Book a Consultation
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Share a few details and our team will reach out with available slots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <Form {...consultationForm}>
                    <form
                      onSubmit={consultationForm.handleSubmit(handleConsultationSubmit)}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={consultationForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                First Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter first name"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Last Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter last name"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Email <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="your.email@company.com"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Phone Number <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="+971 5X XXX XXXX"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {consultationError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {consultationError}
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={isSubmittingConsultation}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00AEEF] text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Phone className="h-5 w-5" />
                        {isSubmittingConsultation ? "Sending..." : "Submit Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

