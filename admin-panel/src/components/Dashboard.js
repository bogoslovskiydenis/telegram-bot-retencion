import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from "../firebase";
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getAuth, signOut } from "firebase/auth";

const Dashboard = () => {
    const [currentView, setCurrentView] = useState('send');
    const [textMessage, setTextMessage] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [updateTextMessage, setUpdateTextMessage] = useState('');
    const [messageStatus, setMessageStatus] = useState('');
    const [userIds, setUserIds] = useState([]);
    const [userNames, setUserNames] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState('');
    const [contentText, setContentText] = useState('');
    const [videos, setVideos] = useState({});
    const [videoPreview, setVideoPreview] = useState(null);
    const videoRef = useRef(null);
    const [urls, setUrls] = useState({});
    const [currentUrl, setCurrentUrl] = useState('');

    const navigate = useNavigate();

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const BOT_TOKEN = process.env.REACT_APP_BOT_TOKEN;

    const fetchUserIds = useCallback(async () => {
        try {
            const usersCollection = collection(db, 'users');
            const userSnapshot = await getDocs(usersCollection);
            const ids = userSnapshot.docs.map(doc => doc.data().userId);
            setUserIds(ids);
        } catch (error) {
            console.error('Error fetching user IDs:', error);
            setMessageStatus('Failed to fetch user IDs. Please try again.');
        }
    }, [db]);

    const fetchContent = async (contentType) => {
        try {
            const response = await axios.get(`http://localhost:5004/api/get-text/${contentType}`);
            setContentText(response.data.text);

            const textResponse = await axios.get(`http://localhost:5004/api/get-text/${contentType}`);
            setContentText(textResponse.data.text);

            const videoUrl = await axios.get(`http://localhost:5004/api/get-video/${contentType}`, {
                responseType: 'blob'
            });

            const urlResponse = await axios.get(`http://localhost:5004/api/get-url/${contentType}`);
            setUrls(prevUrls => ({
                ...prevUrls,
                [contentType]: urlResponse.data.url || ''
            }));


            // Check if the video URL is valid
            if (videoUrl.data && videoUrl.data.size > 0) {
                const videoObjectUrl = URL.createObjectURL(videoUrl.data);
                setVideos({
                    ...videos,
                    [contentType]: videoObjectUrl
                });
                setVideoPreview(videoObjectUrl);
            } else {
                setVideos({
                    ...videos,
                    [contentType]: ''
                });
                setVideoPreview(null);
            }
        } catch (error) {
            console.error(`Error fetching ${contentType}:`, error);
            setMessageStatus(`Failed to fetch ${contentType}. Please try again.`);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchContent(selectedContentType);
                await fetchUserIds();
            } catch (error) {
                console.error('Error fetching data:', error);
                setMessageStatus('Failed to fetch data. Please try again.');
            }
        };

        fetchData();
    }, [fetchUserIds, selectedContentType]);

    const handleTextMessageChange = (e) => setTextMessage(e.target.value);
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
    };
    const handleUpdateTextChange = (e) => setUpdateTextMessage(e.target.value);
    const handleVideoUpload = async () => {
        if (!videoFile) {
            setMessageStatus('Please select a video file');
            return;
        }

        const formData = new FormData();
        formData.append('video', videoFile);

        try {
            const response = await axios.post(`http://localhost:5004/api/upload-video/${selectedContentType}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data && response.data.message) {
                setMessageStatus(response.data.message);
                fetchContent(selectedContentType); // Refresh content after upload
            } else {
                setMessageStatus('Unexpected response from server');
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            setMessageStatus('Failed to upload video. Please try again.');
        }
    };
    const sendMessageAndVideoToTelegram = async () => {
        if (!videoFile && !textMessage) {
            setMessageStatus('Please select a video file or enter a text message.');
            return;
        }

        setMessageStatus('Sending message and/or video to all users...');
        let successCount = 0;
        let failCount = 0;

        for (const userId of userIds) {
            try {
                if (videoFile) {
                    const formData = new FormData();
                    formData.append('chat_id', userId);
                    formData.append('caption', textMessage);
                    formData.append('video', videoFile);

                    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (response.data && response.data.ok) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`Failed to send video to user ${userId}:`, response.data);
                    }
                } else if (textMessage) {
                    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        chat_id: userId,
                        text: textMessage
                    });

                    if (response.data && response.data.ok) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`Failed to send message to user ${userId}:`, response.data);
                    }
                }
            } catch (error) {
                failCount++;
                console.error(`Error sending to user ${userId}:`, error.response ? error.response.data : error.message);
            }
        }

        setTextMessage('');
        setVideoFile(null);
        setMessageStatus(`Message/Video sent to ${successCount} users. Failed for ${failCount} users.`);
    };

    const updateBotContent = async () => {
        try {
            const textResponse = await axios.post(`http://localhost:5004/api/update-text/${selectedContentType}`, {
                text: contentText,
            });

            const urlResponse = await axios.post(`http://localhost:5004/api/update-url/${selectedContentType}`, {
                url: urls[selectedContentType],
            });

            if (textResponse.data && textResponse.data.message && urlResponse.data && urlResponse.data.message) {
                setMessageStatus(`${selectedContentType} updated successfully`);
                setContentText(textResponse.data.newText);
                setUrls(prevUrls => ({
                    ...prevUrls,
                    [selectedContentType]: urlResponse.data.newUrl
                }));
            } else {
                setMessageStatus('Unexpected response from server');
            }
        } catch (error) {
            console.error('Error updating bot content:', error);
            setMessageStatus('Failed to update bot content. Please try again.');
        }
    };

    const updateUrl = async () => {
        try {
            const response = await axios.post(`http://localhost:5004/api/update-url/${selectedContentType}`, {
                url: currentUrl,
            });

            if (response.data && response.data.message) {
                setMessageStatus(`${selectedContentType} URL updated successfully`);
                setUrls(prevUrls => ({
                    ...prevUrls,
                    [selectedContentType]: response.data.newUrl
                }));
            } else {
                setMessageStatus('Unexpected response from server');
            }
        } catch (error) {
            console.error('Error updating URL:', error);
            setMessageStatus('Failed to update URL. Please try again.');
        }
    };

    const switchView = (view) => setCurrentView(view);

    const handleLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const userSnapshot = await getDocs(usersCollection);
            const names = userSnapshot.docs.map(doc => doc.data().username);
            setUserNames(names);
            setMessageStatus(`Fetched ${names.length} user names`);
        } catch (error) {
            console.error('Error fetching user names:', error);
            setMessageStatus('Failed to fetch user names. Please try again.');
        }
    };

    const exportUsersToExcel = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const userSnapshot = await getDocs(usersCollection);
            const users = userSnapshot.docs.map(doc => doc.data());
            const worksheet = XLSX.utils.json_to_sheet(users);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
            XLSX.writeFile(workbook, "users.xlsx");
            setMessageStatus('Users exported to Excel successfully');
        } catch (error) {
            console.error('Error exporting users to Excel:', error);
            setMessageStatus('Failed to export users to Excel. Please try again.');
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="dashboard">
            <div className={`burger-menu ${isMenuOpen ? 'open' : ''}`}>
                <button onClick={toggleMenu}>☰</button>
                {isMenuOpen && (
                    <div className="dropdown-menu">
                        <button onClick={fetchAllUsers}>Fetch All Users</button>
                        <button onClick={exportUsersToExcel}>Export Users to Excel</button>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>
            <div className="sidebar">
                <button
                    onClick={() => switchView('send')}
                    className={currentView === 'send' ? 'active' : ''}
                >
                    Send Message and Video to Telegram
                </button>
                <button
                    onClick={() => switchView('update')}
                    className={currentView === 'update' ? 'active' : ''}
                >
                    Update Bot Content
                </button>
            </div>
            <div className="content">
                {currentView === 'send' && (
                    <div className="send-message">
                        <h2>Send Message and Video to Telegram</h2>
                        <textarea
                            value={textMessage}
                            onChange={handleTextMessageChange}
                            placeholder="Enter your message"
                        />
                        <input type="file" accept="video/*" onChange={handleVideoChange} />
                        {videoPreview && (
                            <video ref={videoRef} controls src={videoPreview} width="300" />
                        )}
                        <button onClick={sendMessageAndVideoToTelegram}>Send</button>
                    </div>
                )}
                {currentView === 'update' && (
                    <div className="update-content">
                        <h2>Update Bot Content</h2>
                        <select
                            value={selectedContentType}
                            onChange={(e) => setSelectedContentType(e.target.value)}
                        >
                            <option value="preview_welcome">preview_welcome</option>
                            <option value="welcome">Welcome </option>
                            <option value="contact">Contact </option>
                            <option value="sports_book">sports_book</option>
                            <option value="casino">casino</option>
                            <option value="sport_casino">sport_casino</option>
                            <option value="live_casino">live_casino</option>
                            <option value="how_use_bonus">How to Use Bonus</option>
                        </select>
                        <textarea
                            value={contentText}
                            onChange={(e) => setContentText(e.target.value)}
                            placeholder="Update the content text"
                        />
                        <div className="url-input-container">
                            <input
                                type="text"
                                value={currentUrl}
                                onChange={(e) => setCurrentUrl(e.target.value)}
                                placeholder="Enter URL for this section"
                            />
                            <button onClick={updateUrl}>Update URL</button>
                        </div>
                        <input type="file" accept="video/*" onChange={handleVideoChange} />
                        {videos[selectedContentType] && (
                            <>
                                <video ref={videoRef} controls src={videos[selectedContentType]} width="300" />
                            </>
                        )}
                        <button onClick={handleVideoUpload}>Upload Video</button>
                        <button onClick={updateBotContent}>Update Content</button>
                    </div>
                )}
                <p>{messageStatus}</p>
            </div>
        </div>
    );
};

export default Dashboard;