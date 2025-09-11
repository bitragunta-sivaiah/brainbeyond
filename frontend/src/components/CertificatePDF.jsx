// src/components/CertificatePDF.jsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Create styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica', // A safe, default font that works without registration
    border: '10px solid #D4AF37',
    position: 'relative',
  },
  logo: {
    position: 'absolute',
    top: 30,
    left: 40,
    width: 80,
    height: 80,
  },
  seal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 200,
    height: 200,
    opacity: 0.1,
    zIndex: -1,
  },
  contentSection: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Helvetica',
    fontSize: 56,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subTitle: {
    fontFamily: 'Helvetica',
    fontSize: 20,
    color: '#555555',
  },
  recipientName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 48,
    color: '#007bff',
    marginVertical: 20,
    borderBottom: '2px solid #007bff',
    paddingBottom: 5,
  },
  courseTitle: {
    fontFamily: 'Helvetica',
    fontSize: 24,
    color: '#444444',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    margin: 'auto',
    marginTop: 20,
  },
  detailItem: {
    textAlign: 'center',
    marginHorizontal: 15,
  },
  label: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#777777',
    marginBottom: 5,
  },
  value: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 50,
    width: '100%',
    paddingHorizontal: 20,
  },
  signatureBlock: {
    textAlign: 'center',
    width: '40%',
  },
  signatureText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    marginTop: 5,
  },
  signatureLine: {
    borderTop: '1px solid #333333',
    paddingTop: 5,
    marginTop: 20,
  },
});

const CertificatePDF = ({ certificateData }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Background Seal Image - Add your own valid image path here */}
        {/* Example: <Image src="/path/to/your/official-seal.png" style={styles.seal} /> */}
        {/* Placeholder: remove this line and use your own image */}
        <Text style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 100, opacity: 0.05, zIndex: -1 }}>📜</Text>
        
        {/* Top Left Logo - Add your own valid image path here */}
        {/* Example: <Image src="/path/to/your/company-logo.png" style={styles.logo} /> */}
        {/* Placeholder: remove this line and use your own image */}
        <Text style={{ position: 'absolute', top: 30, left: 40, fontSize: 60 }}>🏆</Text>

        <View style={styles.contentSection}>
          <Text style={styles.subTitle}>This is to certify that</Text>
          <Text style={styles.title}>Certificate of Completion</Text>
          <Text style={styles.recipientName}>{certificateData.nameOnCertificate}</Text>
          <Text style={styles.subTitle}>has successfully completed the course</Text>
          <Text style={styles.courseTitle}>"{certificateData.course?.title || 'Unknown Course'}"</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Date of Issue</Text>
            <Text style={styles.value}>
              {new Date(certificateData.issueDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Certificate ID</Text>
            <Text style={styles.value}>{certificateData.certificateId}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Score Achieved</Text>
            <Text style={styles.value}>{certificateData.completionScore}%</Text>
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}></Text> {/* Empty line for visual separation */}
            <Text style={styles.signatureText}>John Doe</Text>
            <Text style={styles.label}>Instructor</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}></Text> {/* Empty line for visual separation */}
            <Text style={styles.signatureText}>Jane Smith</Text>
            <Text style={styles.label}>Director of Education</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CertificatePDF;