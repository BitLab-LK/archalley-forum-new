// Test posts for multiple category classification
export const testPosts = [
  {
    content: "I'm working on a UI/UX design project for a construction company's website. Need help with creating modern architectural layouts and visual design elements for building contractors.",
    expectedCategories: ["Design", "Construction", "Business"]
  },
  {
    content: "Looking for career advice on transitioning from academic research to business consulting. I have a PhD in engineering and want to start my own consultancy firm.",
    expectedCategories: ["Career", "Academic", "Business"]
  },
  {
    content: "Hiring experienced architects and project managers for our construction startup. We specialize in sustainable building design and green construction techniques.",
    expectedCategories: ["Jobs", "Construction", "Design"]
  },
  {
    content: "How to create informative tutorials about business management and entrepreneurship for academic courses? Looking for educational content creation tips.",
    expectedCategories: ["Informative", "Business", "Academic"]
  },
  {
    content: "Professional development workshop for career growth in the design industry. Learn about graphic design, user experience, and creative business strategies.",
    expectedCategories: ["Career", "Design", "Business"]
  },
  {
    content: "Random gibberish text asdfsdf kjhwer xcvn mnb",
    expectedCategories: ["Other"]
  },
  {
    content: "University research project on construction materials and building engineering. Academic study on sustainable architecture and structural design principles.",
    expectedCategories: ["Academic", "Construction", "Design"]
  },
  {
    content: "Step-by-step guide on starting a freelance career in graphic design. Tutorial covers portfolio creation, client acquisition, and business development for creative professionals.",
    expectedCategories: ["Informative", "Career", "Design", "Business"]
  }
]

console.log("Test posts ready:", testPosts.length)