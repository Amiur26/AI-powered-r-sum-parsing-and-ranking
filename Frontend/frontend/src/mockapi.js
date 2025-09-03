// frontend/src/mockapi.js

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const mockApi = {
  uploadJobRequirement: async (file) => {
    console.log("MOCK: Uploading HR PDF:", file.name);
    await delay(150); // simulate fast upload
    return {
      data: { id: 101 }  // mock jobRequirementId
    };
  },

  uploadResumeBatch: async (jobRequirementId, file) => {
    console.log("MOCK: Uploading resumes ZIP:", file.name);
    await delay(150); // simulate fast upload
    return {
      data: { id: 202 }  // mock resumeBatchId
    };
  },

  getJobRequirementStatus: async (id) => {
    console.log("MOCK: Polling job requirement status for", id);
    await delay(100); // simulate quick backend processing
    return {
      data: {
        status: 'processed_jd',
        title: 'Mock Senior Software Engineer'
      }
    };
  },

  getResumeBatchStatus: async (id) => {
    console.log("MOCK: Polling resume batch status for", id);
    await delay(100); // simulate quick ranking
    return {
      data: {
        status: 'completed'
      }
    };
  },

  getRankedResumes: async (batchId) => {
    console.log("MOCK: Fetching ranked resumes for batch", batchId);
    await delay(200); // simulate fetch delay
    return {
      data: [
        {
          id: 1,
          file_name: 'alice_resume.pdf',
          compatibility_score: 96,
          candidate_name: 'Alice Johnson',
          candidate_email: 'alice@example.com',
          extracted_info: { Phone: '123-456-7890' },
          ranking_analysis: {
            Strengths: ['Leadership', 'Django experience'],
          },
        },
        {
          id: 2,
          file_name: 'bob_resume.pdf',
          compatibility_score: 89,
          candidate_name: 'Bob Smith',
          candidate_email: 'bob@example.com',
          extracted_info: { Phone: '987-654-3210' },
          ranking_analysis: {
            Strengths: ['Python', 'REST APIs'],
          },
        },
      ]
    };
  }
};

export default mockApi;
