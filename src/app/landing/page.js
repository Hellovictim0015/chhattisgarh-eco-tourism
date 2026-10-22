import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import React from 'react'
import HotelHero from './com/HotelHero'
import { StayTypes, PopularStays, WhyBook, ListYourHotel } from './com/HotelSections'

function Homepage() {
  return (
    <div className="bg-slate-50">
      <Navbar/>
      <HotelHero/>
      <StayTypes/>
      <PopularStays/>
      <WhyBook/>
      <ListYourHotel/>
      <Footer/>
    </div>
  )
}

export default Homepage
