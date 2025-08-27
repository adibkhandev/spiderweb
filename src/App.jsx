import React, { useEffect } from 'react';
import { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import pdfFile from './../src/files/demo.pdf'
import dropDown from './images/down-arrow.png'
const App = () => {
    const pdfUrl = pdfFile
    const thumbnailPluginInstance = thumbnailPlugin();
    const { Cover } = thumbnailPluginInstance;
    const [totalPages, setTotalPages] = useState(0);
    const [startOrEnd,setStartOrEnd] = useState(null)
    const [arrayOfPageNumbers,setArrayOfPageNumbers] = useState([])
    useEffect(()=>{
        console.log(arrayOfPageNumbers,'a')
    },[arrayOfPageNumbers])
    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div className="page-container">
                <div 
                    className='cover-container-main'
                    style={{ 
                        borderRadius: '12px',
                        maxWidth: '100%',
                    }}
                >
                    {/* Render all thumbnails immediately */}
                    {totalPages > 0 && (
                        Array.from({ length: totalPages }).map((_, index) => (
                            <CoverComponent 
                              index={index} 
                              Cover={Cover}
                              arrayOfPageNumbers={arrayOfPageNumbers}
                              setArrayOfPageNumbers={setArrayOfPageNumbers} 
                              startOrEnd={startOrEnd}
                              setStartOrEnd={setStartOrEnd}
                            />
                        ))
                    )}

                    {/* Hidden viewer to provide context and load the PDF */}
                    <div className='viewer'>
                        <Viewer
                            fileUrl={pdfUrl}
                            plugins={[thumbnailPluginInstance]}
                            onDocumentLoad={(e) => {
                                setTotalPages(e.doc.numPages);
                            }}
                        />
                    </div>
                </div>
            </div>
        </Worker>
    );
};


const CoverComponent = ({index,arrayOfPageNumbers,setArrayOfPageNumbers,Cover,startOrEnd,setStartOrEnd}) => {
    const [addedToArray,setAddedToArray] = useState(false) 
    const checkStartOrEndThenPush = () => {
        if(startOrEnd =='end'){
                setArrayOfPageNumbers(()=>{
                   const newArray = [...arrayOfPageNumbers]
                   const lastIndex = arrayOfPageNumbers.length - 1
                   newArray[lastIndex] = {
                       ...newArray[lastIndex],
                       end:index,
                   }
                   return newArray
               })
               setStartOrEnd('start')
        }
        else{
               
               setArrayOfPageNumbers([...arrayOfPageNumbers,{
                'start':index
               }])
               setStartOrEnd('end')

       }
       return 'end'
    }
    const clickHandler = (index,e) => {
        //  e.stopPropagation()
        console.log('ck')
        if(!droppedDown){
            if(!addedToArray){
                setAddedToArray("blue")
                checkStartOrEndThenPush(index)
            }  
            if(addedToArray=="blue"){
                setAddedToArray("red")
                setArrayOfPageNumbers([...arrayOfPageNumbers,index])
                checkStartOrEndThenPush(index)
            }
            if(addedToArray=="red"){
                setAddedToArray(false)
                const indexOfTarget = arrayOfPageNumbers.map((object,indexOfTarget)=>{
                if(object.end==index){
                    return indexOfTarget
                }
                })
                const currentArray = [...arrayOfPageNumbers]
                currentArray.pop(indexOfTarget)
                setArrayOfPageNumbers([...currentArray])
            }    
        }
        
          console.log('clocks')
    }


    const [dropedDownExists,setDropedDownExists] = useState(false)
    const dropDownHandler = option => {
        console.log('in')
        arrayOfPageNumbers.map((object,targetIndex)=>{
            if(object.end===index){
                setArrayOfPageNumbers(()=>{
                    const newArray = [...arrayOfPageNumbers]
                    const newObject = newArray[targetIndex]
                    newArray[targetIndex] = {
                        ...newObject,
                        topic:option
                    }
                    return newArray
                })
            }
        })
    }
    const findIndex = () => {
        
    }
    useEffect(()=>{
        arrayOfPageNumbers.map((object)=>{
            if(object.end==index){
                setDropedDownExists(true)
            }
            else{
                setDropedDownExists(false)
            }
        })
        
    },[arrayOfPageNumbers])
    const options = [
        'Surds',
        'Fractions'
    ]
    const [droppedDown,setDropedDown] = useState(false)
    return(
        <div onClick={()=>{
            if(droppedDown){
                setDropedDown(false)
            }
        }}  
        className='cover-container'>
          
          {/* DropDown */}
          {arrayOfPageNumbers.map((object)=>{
            if(object.end===index)
              {
                return (
                    <div style={droppedDown?{zIndex:5}:{}} className="drop-container">
                        <div onClick={()=> setDropedDown(true)} className="drop-icon-cont">
                          <img  className='drop-down' src={dropDown} alt="" />
                        </div>
                        
                           {droppedDown?(
                            <div className="dropdown-menu">
                            {options.map((option)=>{
                               return( 
                               <div onClick={()=>dropDownHandler(option)} className="section">
                                    <h1>
                                        {option}
                                    </h1>
                                </div>
                               )
                            })}
                           </div>
                           ):''}
                        
                        
                    </div>
                      )
              }
            }) 
          }
          {/* Ends */}



          <div onClick={()=>{clickHandler(index)
           }} className="">
            <Cover
            
                key={index}
                getPageIndex={() => index + 1}
                width={550}
            />

            <div 
            className='fore-ground'
                style={
                addedToArray=="blue"?{backgroundColor:'aqua'}:
                addedToArray=="red"?{backgroundColor:'red'}:
                {}
                }>
            </div>
          </div>


        </div>
    )
}

export default App;