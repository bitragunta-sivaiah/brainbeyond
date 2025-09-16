import Blogs from '@/components/Blogs'
import FAQ from '@/components/FAQ'
import Subscription from '@/components/Subscription'
import React from 'react'

import Ads from '@/components/Ads'
 
import Hero from '@/components/Hero'
import { useSelector } from 'react-redux'
import Features from '@/components/Features'
import Process from '@/components/Process'
import InformationBB from '@/components/InformationBB'
import SpecialBB from '@/components/SpecialBB'

const Home = () => {
  const {user} = useSelector(state=>state.auth)
  return (
    <div className='bg-background'>
      <Hero/>
      
      {/* Corrected Condition: Wrapped the OR condition in parentheses */}
      {(!user || user.role === 'student') && (
        <>
          <Features/>
          <Process/>
          <InformationBB/>
          <SpecialBB/>
          {/* <Events/> */}
          <Ads position='homepage-side'/>
          <Ads position='enroll-course'/>
          {/* <Subscription/> */}
          {/* <Blogs/> */}
          <FAQ/>
        </>
      )}
    </div>
  )
}

export default Home
