import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { questionsData } from '@/lib/questions';
import { google } from 'googleapis';

// Define the structure of the request body
interface AssessmentData {
  personalInfo: {
    name: string;
    email: string;
    company: string;
    position: string;
  };
  answers: Record<string, string>;
  score: number;
}

interface PersonalInfo {
  name: string;
  email: string;
  company: string;
  position: string;
}


// Create styles for the PDF
const createStyles = () => StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#757574',
    position: 'relative',
  },
  fullPageImageContainer: {
    width: 595.28, // A4 width in points
    height: 841.89, // A4 height in points
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPageImage: {
    width: 595.28, // A4 width in points
    height: 841.89, // A4 height in points
  },
  letterheadHeader: {
    backgroundColor: '#009CD9',
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 40,
    paddingRight: 40,
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 40,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
    textAlign: 'left',
  },
  companyTagline: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'left',
  },
  managingPartner: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  headerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
    borderTopStyle: 'solid',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left',
  },
  documentDate: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'right',
  },
  contentArea: {
    padding: 40,
    paddingTop: 30,
    paddingBottom: 30,
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D9C2D',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#2D9C2D',
    borderBottomStyle: 'solid',
    textAlign: 'left',
  },
  personalInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#009CD9',
    borderLeftStyle: 'solid',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#757574',
    width: '25%',
    textAlign: 'left',
  },
  infoValue: {
    fontSize: 11,
    color: '#2D9C2D',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  scoreContainer: {
    backgroundColor: '#f0f9ff',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#757574',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D9C2D',
    marginBottom: 20,
  },
  percentageContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#009CD9',
    borderTopStyle: 'solid',
    alignItems: 'center',
    width: '100%',
  },
  percentageLabel: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  percentageValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#009CD9',
  },
  gaugeContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  gaugeOuter: {
    width: 200,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeSemiCircle: {
    width: 200,
    height: 100,
    borderTopWidth: 8,
    borderTopColor: '#ef4444',
    borderLeftWidth: 8,
    borderLeftColor: '#ef4444',
    borderRightWidth: 8,
    borderRightColor: '#22c55e',
    borderRadius: 100,
    borderBottomWidth: 0,
    position: 'relative',
  },
  gaugeNeedle: {
    position: 'absolute',
    width: 2,
    height: 80,
    backgroundColor: '#1E293B',
    top: 20,
    left: 99,
  },
  gaugeCenter: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    top: 100,
    left: 92,
  },
  gaugePercentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 10,
    textAlign: 'center',
  },
  gaugeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  gaugeLabel: {
    fontSize: 9,
    color: '#1E293B',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009CD9',
    textAlign: 'center',
    lineHeight: 1.4,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#009CD9',
    borderStyle: 'solid',
  },
  questionsTableContainer: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionsTableContainerPageBreak: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionsTable: {
    marginTop: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D9C2D',
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#009CD9',
    borderBottomStyle: 'solid',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#ffffff',
    borderRightStyle: 'solid',
  },
  tableHeaderCellLast: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
    backgroundColor: '#f8f9fa',
  },
  tableRowLast: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  tableRowAltLast: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    borderRightStyle: 'solid',
  },
  tableCellLast: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
  },
  tableCellText: {
    fontSize: 10,
    color: '#757574',
    lineHeight: 1.4,
  },
  letterheadFooter: {
    backgroundColor: '#757574',
    padding: 15,
    paddingLeft: 40,
    paddingRight: 40,
    marginTop: 'auto',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 9,
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 1.3,
  },
  footerDescription: {
    fontSize: 8,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'left',
    lineHeight: 1.2,
    fontStyle: 'italic',
  },
});

// Helper function to generate PDF buffer
async function generatePDFBuffer(
  personalInfo: PersonalInfo,
  score: number,
  answers: Record<string, string>
): Promise<Buffer> {
  const styles = createStyles();
  const currentQuestions = questionsData;

  const createDocument = () => {
    const currentDate = new Date().toLocaleDateString('en-US');
    
    const allAnswers = Object.entries(answers);
    const questionsPerThirdPage = 11; // For the third page (first page of questions)
    const questionsPerPage = 15; // For subsequent pages
    const questionChunks: [string, string][][] = [];
    
    // First chunk: 11 questions (for third page)
    if (allAnswers.length > 0) {
      questionChunks.push(allAnswers.slice(0, questionsPerThirdPage));
    }
    
    // Remaining chunks: rest of the questions
    for (let i = questionsPerThirdPage; i < allAnswers.length; i += questionsPerPage) {
      questionChunks.push(allAnswers.slice(i, i + questionsPerPage));
    }
    
    const createQuestionRows = (answersChunk: [string, string][], isLastPage = false) => {
      return answersChunk.map(([questionId, answerValue]: [string, string], index: number) => {
        const question = currentQuestions.find((q) => q.id === questionId);
        const answer = question?.options.find((opt) => opt.value === answerValue);
        const globalIndex = allAnswers.findIndex(([id]) => id === questionId);
        const isLastRow = isLastPage && index === answersChunk.length - 1;
        const rowStyle = isLastRow 
          ? (globalIndex % 2 === 0 ? styles.tableRowLast : styles.tableRowAltLast)
          : (globalIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt);
        const cellStyle = isLastRow ? styles.tableCellLast : styles.tableCell;
        
        return React.createElement(View, { key: questionId, style: rowStyle },
          React.createElement(View, { style: cellStyle },
            React.createElement(Text, { style: styles.tableCellText }, question?.text || 'Unknown question')
          ),
          React.createElement(View, { style: styles.tableCellLast },
            React.createElement(Text, { style: styles.tableCellText }, answer?.label || 'Unknown answer')
          )
        );
      });
    };

    const createFooter = () => React.createElement(View, { style: styles.letterheadFooter },
      React.createElement(View, { style: styles.footerContent },
        React.createElement(View, { style: styles.footerLeft },
          React.createElement(Text, { style: styles.footerText }, "© 2025 RSM in Kuwait. All rights reserved."),
          React.createElement(Text, { style: styles.footerDescription }, "RSM is a powerful network of assurance, tax and consulting experts with offices all over the world.")
        ),
        React.createElement(View, { style: styles.footerRight },
          React.createElement(Text, { style: styles.footerText }, "Audit | Tax | Consulting Services")
        )
      )
    );

    const pages = [];
    
    // First page: Full-page image
    pages.push(
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.fullPageImageContainer },
          React.createElement(Image, {
            src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM%20Kuwait%20ESG/Gemini_Generated_Image_aq4gg2aq4gg2aq4g.png",
            style: styles.fullPageImage
          })
        )
      )
    );
    
    // Second page: Header, Personal Info, and Score
    pages.push(
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.letterheadHeader },
          React.createElement(View, { style: styles.headerTop },
            React.createElement(View, { style: styles.headerLeft },
              React.createElement(Text, { style: styles.companyName }, "RSM in Kuwait"),
              React.createElement(Text, { style: styles.companyTagline }, "Audit | Tax | Consulting Services")
            ),
            React.createElement(View, { style: styles.headerRight },
              React.createElement(Image, {
                style: styles.logo,
                src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/Intellectus/Untitled%20design%20(2).png"
              })
            )
          ),
          React.createElement(View, { style: styles.headerBottom },
            React.createElement(Text, { style: styles.documentTitle }, "CBK CORF Assessment by RSM in kuwait"),
            React.createElement(Text, { style: styles.documentDate }, currentDate)
          )
        ),
        React.createElement(View, { style: styles.contentArea },
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Detailed Information"),
            React.createElement(View, { style: styles.personalInfoCard },
              React.createElement(View, { style: styles.infoRow },
                React.createElement(Text, { style: styles.infoLabel }, "Name:"),
                React.createElement(Text, { style: styles.infoValue }, personalInfo.name)
              ),
              React.createElement(View, { style: styles.infoRow },
                React.createElement(Text, { style: styles.infoLabel }, "Email:"),
                React.createElement(Text, { style: styles.infoValue }, personalInfo.email)
              ),
              React.createElement(View, { style: styles.infoRow },
                React.createElement(Text, { style: styles.infoLabel }, "Company:"),
                React.createElement(Text, { style: styles.infoValue }, personalInfo.company)
              ),
              React.createElement(View, { style: styles.infoRow },
                React.createElement(Text, { style: styles.infoLabel }, "Position:"),
                React.createElement(Text, { style: styles.infoValue }, personalInfo.position)
              )
            )
          ),
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Assessment Results"),
            React.createElement(View, { style: styles.scoreContainer },
              React.createElement(Text, { style: styles.scoreLabel }, "Assessment Score"),
              React.createElement(Text, { style: styles.scoreValue }, score.toString())
            )
          )
        )
      )
    );

    // Add questions starting from third page (first page is image, second page is header/info/score)
    questionChunks.forEach((chunk, chunkIndex) => {
      const isLastChunk = chunkIndex === questionChunks.length - 1;

      pages.push(
        React.createElement(Page, { size: "A4", style: styles.page },
          React.createElement(View, { style: styles.contentArea },
            React.createElement(View, { style: styles.section },
              // Show "Assessment Details" title only on the first question page (third page overall)
              chunkIndex === 0 ? React.createElement(Text, { style: styles.sectionTitle }, "Assessment Details") : null,
              React.createElement(View, { 
                style: chunkIndex === 0 ? styles.questionsTableContainer : styles.questionsTableContainerPageBreak 
              },
                React.createElement(View, { style: styles.questionsTable },
                  // Show table header only on the first question page
                  chunkIndex === 0 ? React.createElement(View, { style: styles.tableHeader },
                    React.createElement(View, { style: styles.tableHeaderCell },
                      React.createElement(Text, { style: styles.tableHeaderText }, "Question")
                    ),
                    React.createElement(View, { style: styles.tableHeaderCellLast },
                      React.createElement(Text, { style: styles.tableHeaderText }, "Answer")
                    )
                  ) : null,
                  ...createQuestionRows(chunk, isLastChunk)
                )
              )
            )
          ),
          isLastChunk ? createFooter() : null
        )
      );
    });

    return React.createElement(Document, {}, ...pages);
  };

  // Generate PDF buffer - use blob() method and convert to Buffer
  const pdfDoc = pdf(createDocument());
  const blob = await pdfDoc.toBlob();
  
  // Convert Blob to Buffer
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper function to convert column number to letter (e.g., 1 -> A, 27 -> AA)
function columnToLetter(column: number): string {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

// Function to write assessment data to Google Sheets
async function writeToGoogleSheets(
  personalInfo: PersonalInfo,
  answers: Record<string, string>,
  score: number
) {
  try {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS 
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
        : undefined,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1PTQABx0jX010HDNT2b1aFflV5WfjZ6dCrvsdjZ0z3ME';
    const sheetName = 'Sheet1'; // Change if your sheet has a different name

    // Get current questions
    const currentQuestions = questionsData;

    // Prepare headers
    const headers = [
      'Timestamp',
      'Name',
      'Email',
      'Company',
      'Position',
      'Score',
      ...currentQuestions.map(q => `Q${q.id.replace('q', '')} - ${q.text.substring(0, 50)}...`),
    ];

    const lastColumnLetter = columnToLetter(headers.length);
    const headerRange = `${sheetName}!A1:${lastColumnLetter}1`;

    // Check if headers exist, if not, add them
    try {
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: headerRange,
      });

      // If no headers exist, add them
      if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: headerRange,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      } else {
        // Update headers if they don't match (in case questions changed)
        const existingHeaders = headerResponse.data.values[0];
        if (existingHeaders.length !== headers.length || 
            JSON.stringify(existingHeaders) !== JSON.stringify(headers)) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: headerRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [headers],
            },
          });
        }
      }
    } catch (error) {
      // If sheet doesn't exist or error, try to create headers
      console.error('Error checking/updating headers:', error);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
    }

    // Prepare row data
    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,
      personalInfo.name,
      personalInfo.email,
      personalInfo.company,
      personalInfo.position,
      score.toString(),
      ...currentQuestions.map(q => {
        const answerValue = answers[q.id] || '';
        const answer = q.options.find(opt => opt.value === answerValue);
        return answer ? answer.label : '';
      }),
    ];

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:${lastColumnLetter}`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('Successfully wrote assessment data to Google Sheets');
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    // Don't throw error - we don't want to fail the email sending if sheets write fails
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { personalInfo, answers, score } = req.body as AssessmentData
  const currentQuestions = questionsData;

  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  // Prepare email content with HTML formatting
  const emailContent = `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            direction: ltr;
          }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; }
          .score { font-size: 24px; font-weight: bold; color: #27ae60; text-align: center; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .logo { display: block; margin: 0 auto; max-width: 200px; background: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm-international-vector-logo_2-removebg-preview_5f53785d-2f5c-421e-a976-6388f78a00f2.png" alt="RSM Logo" class="logo">
          <h1>CBK CORF Assessment by RSM in kuwait</h1>
          <div class="section">
            <table>
              <tr>
                <th colspan="2">Personal Information</th>
              </tr>
              <tr>
                <td><strong>Name:</strong></td>
                <td>${personalInfo.name}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>${personalInfo.email}</td>
              </tr>
              <tr>
                <td><strong>Company:</strong></td>
                <td>${personalInfo.company}</td>
              </tr>
              <tr>
                <td><strong>Position:</strong></td>
                <td>${personalInfo.position}</td>
              </tr>
            </table>
          </div>
          <div class="section">
            <h2 class="score">Assessment Score: ${score}</h2>
          </div>
          <div class="section">
            <table>
              <tr>
                <th>Question</th>
                <th>Answer</th>
              </tr>
              ${Object.entries(answers).map(([questionId, answerValue]) => {
                const question = currentQuestions.find(q => q.id === questionId);
                const answer = question?.options.find(opt => opt.value === answerValue);
                return `
                  <tr>
                    <td>${question?.text || 'Unknown question'}</td>
                    <td>${answer?.label || 'Unknown answer'}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    // Generate PDF buffer
    const pdfBuffer = await generatePDFBuffer(personalInfo, score, answers);

    // Prepare user email content with appointment booking information
    const userEmailContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #1b3a57;
              background-color: #f4f7fb;
              direction: ltr;
            }
            .email-wrapper {
              width: 100%;
              background-color: #f4f7fb;
              padding: 20px 0;
            }
            .email-container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #009CD9 0%, #0077a3 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              max-width: 180px;
              height: auto;
              margin-bottom: 20px;
              background: none;
            }
            .header-title {
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              text-align: center;
              letter-spacing: -0.5px;
            }
            .content-section {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1b3a57;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .body-text {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .cta-card {
              background: linear-gradient(135deg, #f0fbff 0%, #e6f7ff 100%);
              border: 2px solid #00AEEF;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              text-align: center;
            }
            .cta-icon {
              font-size: 48px;
              margin-bottom: 15px;
            }
            .cta-title {
              font-size: 20px;
              font-weight: 700;
              color: #1b3a57;
              margin-bottom: 15px;
            }
            .cta-text {
              font-size: 15px;
              color: #4a5568;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .email-button {
              display: inline-block;
              background-color: #00AEEF;
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 50px;
              font-weight: 600;
              font-size: 16px;
              margin: 10px 5px;
              transition: background-color 0.3s;
              box-shadow: 0 4px 12px rgba(0, 174, 239, 0.3);
            }
            .email-button:hover {
              background-color: #0091cf;
            }
            .email-address {
              display: inline-block;
              background-color: #ffffff;
              color: #00AEEF;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 18px;
              font-weight: 700;
              margin-top: 15px;
              border: 2px solid #00AEEF;
              text-decoration: none;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, #e2e8f0, transparent);
              margin: 35px 0;
            }
            .footer {
              background-color: #1b3a57;
              padding: 30px;
              text-align: center;
            }
            .footer-text {
              color: #ffffff;
              font-size: 14px;
              line-height: 1.8;
              margin-bottom: 10px;
            }
            .footer-company {
              color: #00AEEF;
              font-weight: 600;
              font-size: 16px;
              margin-top: 15px;
            }
            .attachment-note {
              background-color: #f8f9fa;
              border-left: 4px solid #3F9C35;
              padding: 15px 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .attachment-note-text {
              font-size: 14px;
              color: #4a5568;
              margin: 0;
            }
            .attachment-icon {
              display: inline-block;
              margin-right: 8px;
              font-size: 18px;
            }
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                border-radius: 0;
              }
              .content-section {
                padding: 30px 20px;
              }
              .header {
                padding: 30px 20px;
              }
              .header-title {
                font-size: 24px;
              }
              .cta-card {
                padding: 25px 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <!-- Header -->
              <div class="header">
                <img src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm-international-vector-logo_2-removebg-preview_5f53785d-2f5c-421e-a976-6388f78a00f2.png" alt="RSM Logo" class="logo">
                <h1 class="header-title">CBK CORF Assessment by RSM in kuwait</h1>
              </div>
              
              <!-- Content -->
              <div class="content-section">
                <p class="greeting">Dear ${personalInfo.name},</p>
                <p class="body-text">Thank you for completing the Cybersecurity Self-Assessment. Please find your detailed assessment report attached to this email.</p>
                
                <!-- Attachment Note -->
                <div class="attachment-note">
                  <p class="attachment-note-text">
                    <span class="attachment-icon">📎</span>
                    <strong>Your Assessment Report</strong> is attached to this email as a PDF document.
                  </p>
                </div>
                
                <div class="divider"></div>
                
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <p class="footer-text">Best regards,<br />RSM in Kuwait Team</p>
                <p class="footer-company">RSM in Kuwait</p>
                <p class="footer-text" style="font-size: 12px; opacity: 0.8; margin-top: 15px;">
                  Audit | Tax | Consulting Services
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to user with PDF attachment
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: personalInfo.email,
      replyTo: 'cybersecurity@rsm.com.kw',
      subject: "CBK CORF Assessment by RSM in kuwait",
      html: userEmailContent,
      attachments: [
        {
          filename: `${personalInfo.company}_Cyber_Self_Assessment_Report.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    // Send internal notification email (without PDF)
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: "arpit.m@nexuses.in , anisha.a@nexuses.in",
      subject: "CBK CORF Assessment by RSM in kuwait",
      html: emailContent,
    })

    // Write assessment data to Google Sheets
    await writeToGoogleSheets(personalInfo, answers, score);

    res.status(200).json({ message: 'Assessment results sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ message: 'Failed to send assessment results' })
  }
}
