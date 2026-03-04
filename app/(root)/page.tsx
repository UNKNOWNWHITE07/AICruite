import React from 'react'
import { Button } from '@radix-ui/themes'
import Link from 'next/link'
import Image from 'next/image'
import { dummyInterviews } from '@/constants'
import InterviewCard from '@/components/InterviewCard'

const Page = () => {
  return (
   <div className="flex flex-col gap-16 p-6 md:p-12  rounded-3xl shadow-2xl">
      {/* Hero Section */}
      <section className="card-cta flex flex-col md:flex-row items-center justify-between gap-10 bg-[#B8B8FF] rounded-3xl p-8 md:p-20 shadow-lg">
        <div className="flex flex-col gap-8 max-w-xl">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white">
            Get Interview-Ready with AI-Powered Practice & Feedback
          </h1>
          <p className="text-xl font-medium text-white">
            Practice on real interview questions & get instant feedback to ace your next big opportunity.
          </p>
          <Link href="/interview" className="w-fit">
            <Button className="cursor-pointer flex items-center justify-center rounded-full bg-[#0D0D2B] px-10 py-6 text-lg font-bold text-white hover:bg-black transition-all">
              Start Practicing
            </Button>
          </Link>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={450}
          height={450}
          className="max-sm:hidden object-contain drop-shadow-2xl"
          priority
        />
      </section>

      {/* Your Interviews Section */}
      <section className="flex flex-col gap-8">
        <h2 className="text-32 font-bold text-white border-b-4 border-[#B8B8FF] w-fit pb-2">
          Your Interviews
        </h2>
        <div className="interviews-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dummyInterviews.length > 0 ? (
            dummyInterviews.map((interview, index) => (
              <InterviewCard key={interview.id} {...interview} />
            ))
          ) : (
            <div className="col-span-full p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-[#B8B8FF]">
              <p className="text-20 font-bold text-white text-center">
                You haven't taken any interviews yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Take Interview Section */}
      <section className="flex flex-col gap-8">
        <h2 className="text-32 font-bold text-white border-b-4 border-[#B8B8FF] w-fit pb-2">
          Take Interview
        </h2>
        <div className="interviews-section p-16 bg-gry-900 rounded-3xl text-center shadow-inner">
          {dummyInterviews.map((interview, index) => (
            <InterviewCard key={interview.id} {...interview} />
          ))}
          <p className="text-gray-100 text-lg font-semibold">
  You haven't taken any interviews yet.
</p>
        </div>
      </section>
    </div>
  )
}

export default Page