import { Box, Container, Typography, Button, Card, CardContent, CardMedia } from '@mui/material'
import { ArrowForward, Map, Train, Palette, Undo } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import editorInterface from './assets/transit-editor-interface.png'
import editorExample from './assets/transit-editor-example.png'

export function LandingPage() {
    const navigate = useNavigate()

    const handleNavigateToEditor = () => {
        void navigate('/editor')
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    py: 12,
                    px: 3,
                }}
            >
                <Container maxWidth="lg">
                    <Typography variant="h1" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
                        Transit Map Editor
                    </Typography>
                    <Typography variant="h4" component="h2" sx={{ mb: 4, opacity: 0.95 }}>
                        Create beautiful, schematic transit maps directly in your browser
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 6, maxWidth: 600, opacity: 0.9 }}>
                        A powerful, browser-based editor for designing schematic transit maps.
                        Perfect for urban planners, transit enthusiasts, and anyone who wants to visualize transportation networks.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        onClick={handleNavigateToEditor}
                        endIcon={<ArrowForward />}
                        sx={{ py: 2, px: 4, fontSize: '1.1rem' }}
                    >
                        Start Creating
                    </Button>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 12 }}>
                <Typography variant="h3" component="h2" sx={{ mb: 8, textAlign: 'center', fontWeight: 600 }}>
                    Powerful Features
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Map sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Intuitive Canvas
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Zoom, pan, and interact with your map using intuitive mouse and keyboard controls.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Train sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Octolinear Design
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Automatic snapping to 45° and 90° angles ensures clean, professional-looking maps.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Palette sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Multiple Lines
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Create and manage multiple transit lines with custom colors and names.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', maxWidth: 'calc(25% - 16px)' }}>
                        <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ mb: 2, color: 'primary.main' }}>
                                    <Undo sx={{ fontSize: 48 }} />
                                </Box>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    Undo/Redo
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Full undo/redo support lets you experiment freely without fear of mistakes.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Container>

            {/* Demo Section */}
            <Box sx={{ bgcolor: 'grey.50', py: 12 }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" component="h2" sx={{ mb: 8, textAlign: 'center', fontWeight: 600 }}>
                        See It In Action
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 6 }}>
                        <Box sx={{ flex: '1 1 400px', maxWidth: 'calc(50% - 16px)' }}>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <CardMedia
                                    component="img"
                                    image={editorInterface}
                                    alt="Editor Interface"
                                    sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>Editor Interface</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Clean, modern interface with intuitive controls
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 400px', maxWidth: 'calc(50% - 16px)' }}>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <CardMedia
                                    component="img"
                                    image={editorExample}
                                    alt="Exported Map Example"
                                    sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>Exported Map</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Export your maps as SVG or PNG for sharing
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleNavigateToEditor}
                            endIcon={<ArrowForward />}
                        >
                            Try It Now
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box sx={{ py: 12, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h4" component="h2" sx={{ mb: 4, fontWeight: 600 }}>
                        Ready to Create Your Transit Map?
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 6, color: 'text.secondary' }}>
                        Start designing your schematic transit map today. No installation required - everything runs in your browser.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleNavigateToEditor}
                        endIcon={<ArrowForward />}
                        sx={{ py: 2, px: 6 }}
                    >
                        Launch Editor
                    </Button>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ bgcolor: 'grey.900', color: 'grey.300', py: 6, px: 3 }}>
                <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                        Built with React, TypeScript, and Material Design
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        © 2026 Transit Map Editor. Open source and free to use.
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Typography
                            variant="body2"
                            component="a"
                            href="https://github.com/minzen/transit-editor"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'primary.light', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            GitHub Repository
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.500' }}>
                            •
                        </Typography>
                        <Typography
                            variant="body2"
                            component="a"
                            href="https://issues.transit-map-editor.online/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'primary.light', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Report Issues
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    )
}
